"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import ImageUploadField from "@/components/uploads/ImageUploadField";

import {
  useLikeCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/lib/features/community/communityApi";
import { useSearchUsersQuery } from "@/lib/features/user/userApi";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";
import { useActionPopup } from "@/components/feedback/useActionPopup";

// ─── Render stored comment content (mention tokens → styled spans) ────────────
function renderContent(content) {
  if (!content) return null;

  const mentionRegex = /@\[([a-f\d]{24})\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`txt-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <span
        key={`mention-${match.index}`}
        className="font-semibold text-[#0866FF] hover:underline cursor-pointer"
      >
        @{match[2]}
      </span>
    );
    lastIndex = mentionRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`txt-end`}>{content.substring(lastIndex)}</span>);
  }

  return parts;
}

// ─── Rich Editing Helpers ──────────────────────────────────────────────────

function getEditorTextValue(el) {
  if (!el) return "";
  let result = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.dataset?.mentionId) {
        result += `@[${node.dataset.mentionId}](${node.dataset.mentionName})`;
      } else if (node.tagName === "BR") {
        result += "\n";
      } else {
        result += node.textContent;
      }
    }
  });
  return result;
}

function convertRawToHtml(content) {
  if (!content) return "";
  const mentionRegex = /@\[([a-f\d]{24})\]\(([^)]+)\)/g;
  // Replace newlines with <br/> for contenteditable
  const withBr = content.replace(/\n/g, "<br/>");
  return withBr.replace(mentionRegex, (match, id, name) => {
    return `<span data-mention-id="${id}" data-mention-name="${name}" contenteditable="false" class="inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none">@${name}</span>\u00A0`;
  });
}

function insertMentionChip(editor, mentionStart, mentionLength, userId, userName) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const chip = document.createElement("span");
  chip.dataset.mentionId = userId;
  chip.dataset.mentionName = userName;
  chip.contentEditable = "false";
  chip.className = "inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none";
  chip.textContent = `@${userName}`;

  const range = sel.getRangeAt(0);
  let charCount = 0;
  let targetNode = null;
  let targetOffset = 0;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLen = node.textContent.length;
    if (charCount + nodeLen >= mentionStart) {
      targetNode = node;
      targetOffset = mentionStart - charCount;
      break;
    }
    charCount += nodeLen;
  }

  if (!targetNode) return;

  const deleteRange = document.createRange();
  deleteRange.setStart(targetNode, targetOffset);
  deleteRange.setEnd(range.endContainer, range.endOffset);
  deleteRange.deleteContents();

  const space = document.createTextNode("\u00A0");
  deleteRange.insertNode(space);
  deleteRange.insertNode(chip);

  const newRange = document.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CommentItem({ comment, replies = [], onReply }) {
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const isTarget = String(comment._id) === String(targetCommentId);
  const itemRef = useRef(null);
  const optionsRef = useRef(null);

  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthor = String(comment.author?._id) === String(currentUserId);

  const [likeComment, { isLoading: isLiking }] = useLikeCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const { showSuccess, requestDeleteConfirmation } = useActionPopup();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editImage, setEditImage] = useState(comment.images?.[0] || null);
  const [showEditImageUpload, setShowEditImageUpload] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  // Mention state for editing
  const editRef = useRef(null);
  const dropdownRef = useRef(null);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: searchData, isFetching: isSearching } = useSearchUsersQuery(mentionQuery, {
    skip: !mentionActive
  });
  const suggestions = searchData?.data ?? [];
  const showDropdown = mentionActive && suggestions.length > 0;

  // Scroll to target comment from notification link
  useEffect(() => {
    if (isTarget && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isTarget]);

  // Close options when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          editRef.current && !editRef.current.contains(e.target)) {
        setMentionActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectMention = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;
    const editor = editRef.current;
    if (!editor) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const textBeforeCursor = preRange.toString();

    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt === -1) {
      setMentionActive(false)
      return;
    }

    const charBefore = textBeforeCursor[lastAt - 1];
    if (lastAt > 0 && charBefore !== " " && charBefore !== "\n" && charBefore !== "\u00A0") {
      setMentionActive(false);
      return;
    }

    const query = textBeforeCursor.substring(lastAt + 1);
    if (query.includes(" ") || query.includes("\n")) {
      setMentionActive(false);
      return;
    }

    setMentionActive(true);
    setMentionQuery(query);
    setMentionStart(lastAt);
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!mentionActive || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelectUser(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setMentionActive(false);
    }
  }, [mentionActive, suggestions, selectedIndex]);

  const handleSelectUser = (user) => {
    const editor = editRef.current;
    if (!editor) return;
    const queryLen = 1 + mentionQuery.length;
    insertMentionChip(editor, mentionStart, queryLen, user._id, user.fullName);
    setMentionActive(false);
    setMentionQuery("");
    editor.focus();
  };

  const handleLike = async () => {
    try { await likeComment(comment._id).unwrap(); }
    catch (err) { console.error("Failed to like comment:", err); }
  };

  const handleUpdate = async () => {
    const editor = editRef.current;
    const finalContent = getEditorTextValue(editor);
    if (!finalContent.trim() && !editImage) return;
    try {
      await updateComment({ 
        commentId: comment._id, 
        content: finalContent,
        images: editImage ? [editImage] : []
      }).unwrap();
      setIsEditing(false);
      setShowEditImageUpload(false);
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDelete = async () => {
    const confirmed = await requestDeleteConfirmation({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      approveLabel: "Yes, Delete"
    });
    if (!confirmed) return;
    try { 
      await deleteComment(comment._id).unwrap(); 
      showSuccess("Comment deleted successfully.");
    }
    catch (err) { console.error("Failed to delete comment:", err); }
  };

  const hasReplies = replies.length > 0;
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);

  return (
    <div
      ref={itemRef}
      className={`flex gap-2 py-1 px-1 rounded-xl transition-colors duration-700 ${
        isTarget ? "bg-[#FFF3CD]/60" : ""
      }`}
    >
      {/* Avatar */}
      <Avatar
        src={comment.author?.profilePhoto?.url}
        name={comment.author?.fullName}
        className="h-8 w-8 rounded-full shrink-0 mt-0.5"
      />

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="relative inline-block max-w-full group/bubble">
          <div className="rounded-2xl bg-[#F0F2F5] px-3 py-2 inline-block max-w-full">
            {/* Author name */}
            <span className="block text-[13px] font-bold text-[#050505] leading-tight hover:underline cursor-pointer pr-8">
              {comment.author?.fullName}
              {comment.author?.role && <RoleBadge role={comment.author.role} />}
            </span>


            {/* Options button (author only) - Moved inside bubble */}
            {isAuthor && !isEditing && (
              <div
                ref={optionsRef}
                className="absolute right-1 top-1 transition-opacity"
              >
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-[#E4E6EB] text-[#65676B] transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {showOptions && (
                  <div className="absolute right-0 top-full mt-1 w-28 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#E4E6EB] py-1 z-30">
                    <button
                      onClick={() => { setIsEditing(true); setShowOptions(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] font-medium text-[#050505] hover:bg-[#F0F2F5] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-[#65676B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => { handleDelete(); setShowOptions(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] font-medium text-[#E41E3F] hover:bg-[#FFF0F2] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content or Edit form */}
            {isEditing ? (
              <div className="mt-1.5 space-y-2 min-w-[220px]">
                <div className="relative">
                  <div
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={detectMention}
                    onKeyDown={handleKeyDown}
                    onKeyUp={detectMention}
                    onClick={detectMention}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text/plain");
                      document.execCommand("insertText", false, text);
                    }}
                    className="w-full rounded-xl border border-[#E4E6EB] p-2 text-[13.5px] text-[#050505] outline-none focus:ring-1 focus:ring-[#0866FF] bg-white min-h-[60px] max-h-[160px] overflow-y-auto break-words"
                    dangerouslySetInnerHTML={{ __html: convertRawToHtml(comment.content) }}
                  />

                  {/* Mentions Dropdown */}
                  {showDropdown && (
                    <div
                      ref={dropdownRef}
                      className="absolute bottom-full left-0 mb-2 w-[240px] rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-[#E4E6EB] overflow-hidden z-[200]"
                    >
                      <ul className="py-1 max-h-[180px] overflow-y-auto">
                        {suggestions.map((user, idx) => (
                          <li key={user._id}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectUser(user);
                              }}
                              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                                idx === selectedIndex ? "bg-[#F0F2F5]" : "hover:bg-[#F0F2F5]"
                              }`}
                            >
                              <Avatar
                                src={user.profilePhoto?.url}
                                name={user.fullName}
                                className="h-8 w-8 rounded-full shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-semibold text-[#050505] truncate leading-tight">
                                  {user.fullName}
                                </span>
                                <span className="text-[11px] text-[#65676B] truncate capitalize">
                                  {user.role}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Edit Mode Image Upload */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditImageUpload(!showEditImageUpload)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md w-fit transition-colors ${
                      showEditImageUpload || editImage
                        ? "text-[#0866FF] bg-[#E7F3FF]"
                        : "text-[#65676B] hover:bg-[#F0F2F5]"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {editImage ? "Change Photo" : "Add Photo"}
                  </button>

                  {(showEditImageUpload || editImage) && (
                    <div className="rounded-xl border border-dashed border-[#E4E6EB] p-2 bg-[#F7F8FA]">
                      <ImageUploadField
                        asset={editImage}
                        onChange={setEditImage}
                        folder="community-comments"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[12px] font-semibold text-[#65676B] hover:text-[#050505]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="text-[12px] font-semibold text-[#0866FF] hover:underline disabled:opacity-50"
                  >
                    {isUpdating ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[14px] text-[#050505] leading-[1.4] break-words mt-0.5 whitespace-pre-wrap">
                  {renderContent(comment.content)}
                </p>

                {/* Attached images */}
                {comment.images?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comment.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt="Attachment"
                        className="max-w-[220px] rounded-xl border border-[#E4E6EB] cursor-zoom-in hover:opacity-95 transition-opacity"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Like count badge */}
          {comment.likesCount > 0 && (
            <div className="absolute -bottom-3 -right-2 flex items-center gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-[#E4E6EB] text-[11px] font-semibold text-[#65676B]">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0866FF]">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
              </span>
              {comment.likesCount}
            </div>
          )}

        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 px-3 mt-1">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`text-[12px] font-bold transition-colors hover:underline ${
              comment.isLiked ? "text-[#0866FF]" : "text-[#65676B] hover:text-[#050505]"
            }`}
          >
            Like
          </button>
          {!isEditing && (
            <button
              onClick={() => onReply(comment)}
              className="text-[12px] font-bold text-[#65676B] hover:text-[#050505] hover:underline transition-colors"
            >
              Reply
            </button>
          )}
          <span className="text-[11px] text-[#8A8D91]">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Replies */}
        {hasReplies && (
          <div className="mt-1.5 pl-2 border-l-2 border-[#E4E6EB] ml-1">
            {!showAllReplies ? (
              <button
                onClick={() => setShowAllReplies(true)}
                className="flex items-center gap-2 text-[12.5px] font-bold text-[#65676B] hover:underline px-1 py-1 group/replies"
              >
                <div className="flex items-center justify-center w-4 h-4">
                  <svg 
                    className="h-3.5 w-3.5 rotate-180 text-[#8A8D91]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2" />
                  </svg>
                </div>
                <span>
                  {replies.length === 1 
                    ? "View 1 reply" 
                    : `View ${replies.length} replies`}
                </span>
              </button>
            ) : (
              <div className="space-y-1">
                {replies.map((reply) => (
                  <CommentItem 
                    key={reply._id} 
                    comment={reply} 
                    replies={reply.replies || []} 
                    onReply={onReply} 
                  />
                ))}
                {replies.length > 2 && (
                  <button
                    onClick={() => setShowAllReplies(false)}
                    className="text-[12px] font-bold text-[#65676B] hover:underline px-1 py-0.5 mt-0.5"
                  >
                    Hide replies
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
