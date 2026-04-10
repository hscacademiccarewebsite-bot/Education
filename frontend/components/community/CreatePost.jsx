"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Avatar from "@/components/Avatar";
import { useCreatePostMutation, useUpdatePostMutation } from "@/lib/features/community/communityApi";
import { useSelector } from "react-redux";
import { selectToken } from "@/lib/features/auth/authSlice";
import {
  selectCurrentUserDisplayName,
  selectCurrentUserId,
  selectCurrentUserPhotoUrl,
  selectCurrentUserRole,
} from "@/lib/features/user/userSlice";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { useSearchUsersQuery } from "@/lib/features/user/userApi";
import CreateSharedNote from "./CreateSharedNote";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import {
  cleanupUploadedImageAsset,
  isLocalImageAsset,
  resolveImageAssetForSubmit,
  revokeImageAssetPreview,
} from "@/lib/utils/cloudinaryUpload";
import { resizeImage } from "@/lib/utils/imageResizer";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { getUserDisplayRoleLabel } from "@/lib/utils/roleUtils";

const EVERYONE_MENTION_ID = "everyone";
const EVERYONE_MENTION_NAME = "everyone";
const POST_IMAGE_LIMIT = 500 * 1024;
const MAX_POST_IMAGES = 10;

function normalizeMentionContent(value) {
  return String(value || "").replace(
    /(^|[\s\u00A0])@everyone\b/gi,
    (_, prefix) => `${prefix}@[${EVERYONE_MENTION_ID}](${EVERYONE_MENTION_NAME})`
  );
}

function serializeEditorNode(node) {
  if (!node) return "";

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  if (node.dataset?.mentionId) {
    return `@[${node.dataset.mentionId}](${node.dataset.mentionName})`;
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  const content = Array.from(node.childNodes).map(serializeEditorNode).join("");
  return ["DIV", "P", "LI"].includes(node.tagName) ? `${content}\n` : content;
}

function getEditorTextValue(el) {
  if (!el) return "";

  return normalizeMentionContent(
    Array.from(el.childNodes)
      .map(serializeEditorNode)
      .join("")
      .replace(/\u00A0/g, " ")
      .trimEnd()
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function editorHasContent(el) {
  if (!el) return false;
  return getEditorTextValue(el).trim().length > 0;
}

function convertRawToHtml(content) {
  if (!content) return "";
  const mentionRegex = /@\[(everyone|[a-f\d]{24})\]\(([^)]+)\)/g;
  return escapeHtml(content).replace(/\n/g, "<br/>").replace(mentionRegex, (_, id, name) => {
    const displayName = id === EVERYONE_MENTION_ID ? EVERYONE_MENTION_NAME : name;
    return `<span data-mention-id="${id}" data-mention-name="${displayName}" contenteditable="false" class="inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none">@${displayName}</span>&nbsp;`;
  });
}

function insertMentionChip(editor, mentionStart, userId, userName) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const chip = document.createElement("span");
  chip.dataset.mentionId = userId;
  chip.dataset.mentionName = userName;
  chip.contentEditable = "false";
  chip.className = "inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none";
  chip.textContent = `@${userName}`;

  const range = selection.getRangeAt(0);
  let charCount = 0;
  let targetNode = null;
  let targetOffset = 0;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLength = node.textContent.length;

    if (charCount + nodeLength >= mentionStart) {
      targetNode = node;
      targetOffset = mentionStart - charCount;
      break;
    }

    charCount += nodeLength;
  }

  if (!targetNode) return;

  const deleteRange = document.createRange();
  deleteRange.setStart(targetNode, targetOffset);
  deleteRange.setEnd(range.endContainer, range.endOffset);
  deleteRange.deleteContents();

  const space = document.createTextNode("\u00A0");
  deleteRange.insertNode(space);
  deleteRange.insertNode(chip);

  const nextRange = document.createRange();
  nextRange.setStartAfter(space);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
}

function insertPlainTextAtSelection(text) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function clearEditor(el) {
  if (!el) return;
  el.innerHTML = "";
}

function placeCursorAtEnd(el) {
  if (!el) return;
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function cleanupImagePreviewList(images = []) {
  images.forEach((asset) => revokeImageAssetPreview(asset));
}

export default function CreatePost({ 
  post = null, 
  isOpen = false, 
  onClose = () => {}, 
  isTriggerVisible = true 
}) {
  const { t } = useSiteLanguage();
  const isEditMode = !!post;
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const privacyDropdownRef = useRef(null);
  const editorRef = useRef(null);
  const mentionDropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const imagesRef = useRef([]);

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const { showSuccess, showError } = useActionPopup();

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const currentUserId = useSelector(selectCurrentUserId);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);
  const userRole = useSelector(selectCurrentUserRole);
  const token = useSelector(selectToken);
  const [uploadingImage, setUploadingImage] = useState(false);

  const activeIsOpen = post ? isOpen : (isTriggerVisible ? localIsOpen : isOpen);
  const isStaff = ["admin", "teacher", "moderator"].includes(userRole);
  
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, { 
    skip: !activeIsOpen || isStaff 
  });
  
  const { data: allBatchesData } = useListBatchesQuery({}, { 
    skip: !activeIsOpen || !isStaff 
  });

  const availableCourses = isStaff 
    ? (allBatchesData?.data || [])
    : (myEnrollmentsData?.data?.filter(e => e.status === "approved").map(e => e.batch) || []);

  const activeIsLoading = isCreating || isUpdating || uploadingImage;
  const { data: searchData, isFetching: isSearchingUsers } = useSearchUsersQuery(mentionQuery, {
    skip: !mentionActive,
  });
  const mentionSuggestions = [
    ...(EVERYONE_MENTION_NAME.startsWith(mentionQuery.trim().toLowerCase())
      ? [{ _id: EVERYONE_MENTION_ID, fullName: EVERYONE_MENTION_NAME, role: "system", isEveryone: true }]
      : []),
    ...((searchData?.data || []).filter((user) => String(user?._id) !== String(currentUserId))),
  ];
  const showMentionDropdown =
    mentionActive && (isSearchingUsers || mentionSuggestions.length > 0 || mentionQuery.trim().length > 0);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (post) {
      cleanupImagePreviewList(imagesRef.current);
      setContent(post.content || "");
      setPrivacy(post.privacy || "public");
      setEnrolledBatches(post.enrolledBatches || []);
      setImages(post.images || []);
      setShowImageUpload(Boolean(post.images?.length));
    }
  }, [post, isOpen]);

  useEffect(
    () => () => {
      cleanupImagePreviewList(imagesRef.current);
    },
    []
  );

  useEffect(() => {
    if (!activeIsOpen || !editorRef.current) return;

    const editor = editorRef.current;
    editor.innerHTML = convertRawToHtml(post?.content || "");
    setEditorEmpty(!editorHasContent(editor));

    requestAnimationFrame(() => {
      editor.focus();
      placeCursorAtEnd(editor);
    });
  }, [activeIsOpen, post?._id]);

  // Close privacy dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(e.target)) {
        setShowPrivacyDropdown(false);
      }
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target) &&
        editorRef.current &&
        !editorRef.current.contains(e.target)
      ) {
        setMentionActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectMention = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    const editor = editorRef.current;
    if (!editor) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const textBeforeCursor = preRange.toString();

    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt === -1) {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      return;
    }

    const charBefore = textBeforeCursor[lastAt - 1];
    if (lastAt > 0 && charBefore !== " " && charBefore !== "\n" && charBefore !== "\u00A0") {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      return;
    }

    const nextQuery = textBeforeCursor.slice(lastAt + 1);
    if (nextQuery.includes(" ") || nextQuery.includes("\n")) {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      return;
    }

    setMentionActive(true);
    setMentionQuery(nextQuery);
    setMentionStart(lastAt);
    setSelectedIndex(0);
  }, []);

  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current;
    const nextContent = normalizeMentionContent(getEditorTextValue(editor));
    setContent(nextContent);
    setEditorEmpty(!editorHasContent(editor));
    detectMention();
  }, [detectMention]);

  const handleSelectMentionUser = useCallback(
    (user) => {
      const editor = editorRef.current;
      if (!editor) return;

      insertMentionChip(editor, mentionStart, user._id, user.fullName);
      const nextContent = normalizeMentionContent(getEditorTextValue(editor));
      setContent(nextContent);
      setEditorEmpty(!editorHasContent(editor));
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      editor.focus();
    },
    [mentionStart]
  );

  const handleEditorKeyDown = useCallback(
    (event) => {
      if (!mentionActive) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionActive(false);
        setMentionQuery("");
      } else if (mentionSuggestions.length === 0) {
        return;
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((currentIndex) => Math.min(currentIndex + 1, mentionSuggestions.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        if (mentionSuggestions[selectedIndex]) {
          handleSelectMentionUser(mentionSuggestions[selectedIndex]);
        }
      }
    },
    [handleSelectMentionUser, mentionActive, mentionSuggestions, selectedIndex]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalContent = normalizeMentionContent(getEditorTextValue(editorRef.current)).trim();

    if (!finalContent && images.length === 0) return;
    if (privacy === "enrolled_members" && enrolledBatches.length === 0) {
      showError(t("community.composer.selectCourseError", "Please select at least one course to share with."));
      return;
    }

    const uploadedLocalImages = [];
    const resolvedImages = [];
    setUploadingImage(true);

    try {
      for (const imageAsset of images) {
        const resolvedImage = await resolveImageAssetForSubmit(imageAsset, "community-posts", { token });
        if (resolvedImage?.url) {
          resolvedImages.push(resolvedImage);
          if (isLocalImageAsset(imageAsset) && resolvedImage.publicId) {
            uploadedLocalImages.push(resolvedImage);
          }
        }
      }

      if (isEditMode) {
        await updatePost({
          postId: post._id,
          content: finalContent,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
          images: resolvedImages,
        }).unwrap();
      } else {
        await createPost({
          content: finalContent,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
          images: resolvedImages,
        }).unwrap();
      }

      cleanupImagePreviewList(imagesRef.current);
      showSuccess(
        t(
          isEditMode ? "community.postUpdated" : "community.postCreated",
          isEditMode ? "Post updated successfully!" : "Post created successfully!"
        )
      );
      handleClose();
    } catch (err) {
      for (const uploadedImage of uploadedLocalImages) {
        await cleanupUploadedImageAsset(uploadedImage, { token });
      }
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} post:`, err);
      showError(
        err?.data?.message ||
          t(
            isEditMode ? "community.composer.updateFailed" : "community.composer.createFailed",
            isEditMode ? "Failed to update post. Please try again." : "Failed to create post. Please try again."
          )
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenImagePicker = () => {
    if (activeIsLoading) {
      return;
    }
    imageInputRef.current?.click();
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => {
      const target = prev[indexToRemove];
      revokeImageAssetPreview(target);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleClearAllImages = () => {
    cleanupImagePreviewList(imagesRef.current);
    setImages([]);
    setShowImageUpload(false);
  };

  const handleSelectImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const remainingSlots = MAX_POST_IMAGES - imagesRef.current.length;
    if (remainingSlots <= 0) {
      showError(
        t("community.composer.maxPhotosReached", "You can attach up to {count} photos in one post.", {
          count: MAX_POST_IMAGES,
        })
      );
      return;
    }

    const nextFiles = files.slice(0, remainingSlots);
    const preparedImages = [];
    let skippedInvalid = false;
    let skippedResizeFailure = false;

    for (const file of nextFiles) {
      if (!file.type.startsWith("image/")) {
        skippedInvalid = true;
        continue;
      }

      let finalFile = file;
      if (file.size > POST_IMAGE_LIMIT) {
        try {
          finalFile = await resizeImage(file, POST_IMAGE_LIMIT);
        } catch (error) {
          skippedResizeFailure = true;
          continue;
        }
      }

      preparedImages.push({
        url: URL.createObjectURL(finalFile),
        publicId: "",
        file: finalFile,
        isLocal: true,
        name: finalFile.name,
        size: finalFile.size,
      });
    }

    if (skippedInvalid) {
      showError(t("uploadField.errors.invalidImage", "Please choose a valid image file."));
    }

    if (skippedResizeFailure) {
      showError(
        t(
          "community.composer.photoPrepareFailed",
          "Some photos could not be prepared. Please try JPG, PNG, or WebP images."
        )
      );
    }

    if (files.length > remainingSlots) {
      showError(
        t("community.composer.maxPhotosReached", "You can attach up to {count} photos in one post.", {
          count: MAX_POST_IMAGES,
        })
      );
    }

    if (!preparedImages.length) {
      return;
    }

    setImages((prev) => [...prev, ...preparedImages]);
    setShowImageUpload(true);
  };

  const handleClose = () => {
    cleanupImagePreviewList(imagesRef.current);
    setMentionActive(false);
    setMentionQuery("");
    setMentionStart(-1);
    setSelectedIndex(0);

    if (post) {
      setImages(post.images || []);
      setShowImageUpload(Boolean(post.images?.length));
      onClose();
    } else {
      setLocalIsOpen(false);
      setContent("");
      setImages([]);
      setPrivacy("public");
      setEnrolledBatches([]);
      setShowImageUpload(false);
      setShowPrivacyDropdown(false);
      setEditorEmpty(true);
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      setSelectedIndex(0);
      clearEditor(editorRef.current);
    }
  };

  const handleOpen = () => {
    if (!post) setLocalIsOpen(true);
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (activeIsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeIsOpen]);

  return (
    <>
      {/* Trigger Bar - Only visible if not in edit mode and specifically requested */}
      {!isEditMode && isTriggerVisible && (
        <div className="mb-4 lg:mb-6 rounded-xl lg:rounded-2xl border border-slate-200 bg-white p-2.5 lg:p-3 shadow-sm transition-all hover:shadow-md">

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative">
              <Avatar src={userPhotoUrl} name={userDisplayName} className="h-10 w-10 lg:h-11 lg:w-11 rounded-full border border-white ring-1 ring-slate-100" />

              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <button
              onClick={handleOpen}
              className="flex-1 rounded-full bg-slate-50 px-4 lg:px-5 py-2.5 lg:py-3 text-left text-[14px] lg:text-[15px] font-medium text-slate-500 transition-all hover:bg-slate-100/80 active:scale-[0.99]"
            >
              {t("community.composer.prompt", "What's on your mind, {name}?", {
                name: userDisplayName?.split(" ")[0] || "",
              })}
            </button>

          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-50 pt-3">
            <button
              onClick={() => {
                handleOpen();
                setShowImageUpload(true);
              }}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl py-1.5 text-[14px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:bg-slate-100"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[13px] lg:text-[14px]">{t("community.composer.photo", "Photo")}</span>
            </button>

            <div className="h-8 w-[1px] bg-slate-100" />
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl py-1.5 text-[14px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:bg-slate-100"
            >

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-[13px]">{t("community.composer.postNote", "Post a Note")}</span>
            </button>
          </div>
        </div>
      )}

      <CreateSharedNote isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} />

      {/* Professional Modal */}
      {activeIsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 h-screen w-screen bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={handleClose}
          />
          
          <div className="relative w-full max-w-[540px] rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-scale-in border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="w-8" />
              <h2 className="font-display text-[16px] lg:text-[18px] font-bold tracking-tight text-[#147b79]">
                {isEditMode ? t("community.editPost", "Edit Post") : t("community.createPost", "Create Post")}
              </h2>

              <button 
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 px-6 py-4">
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-5">
                  <Avatar src={userPhotoUrl} name={userDisplayName} className="h-11 w-11 rounded-full ring-2 ring-slate-50 shadow-sm" />
                  <div>
                    <p className="font-display text-[15px] font-semibold text-slate-950">{userDisplayName}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                       <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
                        </svg>
                        {t("community.composer.communityLabel", "Community")}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <div className="relative" ref={privacyDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          {privacy === "public" ? (
                            <>
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                              </svg>
                              {t("community.privacy.public", "Public")}
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                              </svg>
                              {t("community.privacy.enrolled", "Enrolled Members")}
                            </>
                          )}
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showPrivacyDropdown && (
                          <div className="absolute right-0 sm:right-auto sm:left-0 mt-1 w-52 max-w-[calc(100vw-80px)] rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 py-1 z-50">
                            <button
                              type="button"
                              onClick={() => {
                                setPrivacy("public");
                                setShowPrivacyDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">{t("community.privacy.public", "Public")}</span>
                                <span className="text-[11px] text-slate-500">{t("community.composer.publicDescription", "Anyone on the platform")}</span>
                              </div>
                              {privacy === "public" && (
                                <svg className="h-4 w-4 text-[#0866FF] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrivacy("enrolled_members");
                                setShowPrivacyDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">{t("community.privacy.enrolled", "Enrolled Members")}</span>
                                <span className="text-[11px] text-slate-500">{t("community.composer.enrolledDescription", "Peers in your courses")}</span>
                              </div>
                              {privacy === "enrolled_members" && (
                                <svg className="h-4 w-4 text-[#0866FF] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Selection block if Enrolled Members is chosen */}
                {privacy === "enrolled_members" && (
                  <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[12px] font-bold text-slate-700 mb-2">{t("community.composer.selectCoursesToShare", "Select courses to share with:")}</p>
                    {availableCourses.length === 0 ? (
                      <p className="text-[12px] text-slate-500">{t("community.composer.noCoursesToShare", "No courses available to share with.")}</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {availableCourses.map((course) => (
                          <label key={course?._id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={enrolledBatches.includes(course?._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEnrolledBatches([...enrolledBatches, course?._id]);
                                } else {
                                  setEnrolledBatches(enrolledBatches.filter(id => id !== course?._id));
                                }
                              }}
                              className="w-4 h-4 rounded text-[#147b79] border-slate-300 focus:ring-[#147b79]"
                            />
                            <span className="text-[13px] text-slate-700 group-hover:text-slate-900 line-clamp-1 flex-1">
                              {course?.name || t("community.composer.unknownCourse", "Unknown Course")}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={detectMention}
                    onClick={detectMention}
                    onPaste={(event) => {
                      const pastedText = event.clipboardData.getData("text/plain");
                      if (!pastedText) return;
                      event.preventDefault();
                      insertPlainTextAtSelection(pastedText);
                      handleEditorInput();
                    }}
                    role="textbox"
                    aria-multiline="true"
                    spellCheck
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    className="min-h-[150px] w-full cursor-text select-text overflow-y-auto rounded-2xl border border-transparent px-4 py-4 text-[16px] font-normal leading-[1.6] text-slate-950 outline-none transition focus:border-slate-200 focus:bg-slate-50/50 md:text-[15px]"
                    style={{
                      WebkitUserSelect: "text",
                      userSelect: "text",
                      WebkitTouchCallout: "default",
                    }}
                  />
                  {editorEmpty ? (
                    <p className="pointer-events-none absolute left-4 top-4 text-[15px] text-slate-400">
                      {t(
                        "community.composer.editorPlaceholder",
                        "What's on your mind, {name}? Type @ to mention someone.",
                        { name: userDisplayName?.split(" ")[0] || "" }
                      )}
                    </p>
                  ) : null}

                  {showMentionDropdown ? (
                    <div
                      ref={mentionDropdownRef}
                      className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
                    >
                      {isSearchingUsers ? (
                        <div className="px-4 py-3 text-[12px] font-medium text-slate-500">{t("community.composer.findingPeople", "Finding people...")}</div>
                      ) : mentionSuggestions.length > 0 ? (
                        <ul className="max-h-[220px] overflow-y-auto py-2">
                          {mentionSuggestions.map((user, index) => (
                            <li key={user._id}>
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  handleSelectMentionUser(user);
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                  index === selectedIndex ? "bg-slate-50" : "hover:bg-slate-50"
                                }`}
                              >
                                {user.isEveryone ? (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V18a4 4 0 00-5-3.87M17 20H7m10 0v-2c0-.653-.126-1.276-.356-1.848M7 20H2V18a4 4 0 015-3.87M7 20v-2c0-.653.126-1.276.356-1.848m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM5 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                  </div>
                                ) : (
                                  <Avatar
                                    src={user.profilePhoto?.url}
                                    name={user.fullName}
                                    className="h-9 w-9 rounded-full shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-semibold text-slate-900">
                                    {user.isEveryone ? "@everyone" : user.fullName}
                                  </p>
                                  <p className="truncate text-[11px] capitalize text-slate-500">
                                    {user.isEveryone
                                      ? t("community.everyoneDescription", "Notify all eligible members")
                                      : getUserDisplayRoleLabel(user, t)}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-[12px] font-medium text-slate-500">
                          {t("community.composer.noMatchingPeople", "No matching people found.")}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="mt-2 px-4 text-[11px] font-medium text-slate-400">
                  {t("community.composer.mentionHint", "Type")} <span className="font-bold text-[#0866FF]">@</span> {t("community.composer.mentionHintSuffix", "to mention someone or everyone in your post.")}
                </p>
                
                {showImageUpload && (
                  <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-3 transition-all hover:border-emerald-200">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleSelectImages}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">
                          {t("community.composer.addPhotosTitle", "Add photos to your post")}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {t("community.composer.photoCountHint", "{count} of {max} selected. Photos upload only when you post.", {
                            count: images.length,
                            max: MAX_POST_IMAGES,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {images.length > 0 ? (
                          <button
                            type="button"
                            onClick={handleClearAllImages}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                          >
                            {t("community.composer.clearPhotos", "Clear All")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowImageUpload(false)}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                          >
                            {t("community.composer.closePhotos", "Close")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenImagePicker}
                          disabled={images.length >= MAX_POST_IMAGES}
                          className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {images.length > 0
                            ? t("community.composer.addMorePhotos", "Add More")
                            : t("community.composer.choosePhotos", "Choose Photos")}
                        </button>
                      </div>
                    </div>

                    {images.length > 0 ? (
                      <div
                        className={`mt-3 grid gap-2 ${
                          images.length === 1
                            ? "grid-cols-1"
                            : images.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-2 md:grid-cols-3"
                        }`}
                      >
                        {images.map((imageAsset, index) => (
                          <div
                            key={`${imageAsset.publicId || imageAsset.url || "image"}-${index}`}
                            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={imageAsset.url}
                              alt={t("community.postImageAlt", "Post image {number}", { number: index + 1 })}
                              className="h-full w-full object-cover"
                              style={{ aspectRatio: images.length === 1 ? "16 / 10" : "1 / 1" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70"
                              aria-label={t("community.composer.removePhoto", "Remove photo")}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                              {index + 1}/{images.length}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenImagePicker}
                        className="mt-3 flex w-full flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-10 text-center transition hover:bg-slate-100"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="mt-3 text-[13px] font-bold text-slate-800">
                          {t("community.composer.pickPhotosPrompt", "Choose one or more photos")}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {t("community.composer.pickPhotosHint", "You can attach up to 10 photos in one post.")}
                        </p>
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-800">{t("community.composer.addToPost", "Add to your post")}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (showImageUpload || images.length > 0) {
                          handleOpenImagePicker();
                          return;
                        }

                        setShowImageUpload(true);
                      }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                        showImageUpload ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50 text-emerald-500"
                      }`}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activeIsLoading || (editorEmpty && images.length === 0)}
                  className="site-button-primary mt-5 w-full !py-3 !text-[13px] font-bold disabled:!opacity-50"
                >
                  {activeIsLoading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>{isEditMode ? t("community.composer.updating", "Updating...") : t("community.composer.posting", "Posting...")}</span>
                    </div>
                  ) : (
                    isEditMode ? t("community.composer.saveChanges", "Save Changes") : t("community.createPost", "Post")
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
