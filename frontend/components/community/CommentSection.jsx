"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Avatar from "@/components/Avatar";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import {
  useGetCommentsQuery,
  useAddCommentMutation,
} from "@/lib/features/community/communityApi";
import { useSearchUsersQuery } from "@/lib/features/user/userApi";
import { useSelector } from "react-redux";
import { selectCurrentUserDisplayName, selectCurrentUserPhotoUrl } from "@/lib/features/user/userSlice";
import CommentItem from "./CommentItem";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract plain-text + mention tokens from the editor DOM.
 * Returns a string like: "Hello @[uid](Name) world"
 */
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

/** Returns true when the editor has any visible content */
function editorHasContent(el) {
  if (!el) return false;
  return el.textContent.trim().length > 0;
}

/** Insert a mention chip at the current cursor position, replacing the @query */
function insertMentionChip(editor, mentionStart, mentionLength, userId, userName) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  // Build the chip element
  const chip = document.createElement("span");
  chip.dataset.mentionId = userId;
  chip.dataset.mentionName = userName;
  chip.contentEditable = "false";
  chip.className =
    "inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none";
  chip.textContent = `@${userName}`;

  // Position range: from mentionStart to current cursor
  const range = sel.getRangeAt(0);
  const containerNode = range.startContainer;

  // Walk the editor's text to find the exact text node and offset for mentionStart
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

  // Insert chip + a trailing space text node
  const space = document.createTextNode("\u00A0");
  deleteRange.insertNode(space);
  deleteRange.insertNode(chip);

  // Move cursor after the space
  const newRange = document.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

/** Clear all content from the editor div */
function clearEditor(el) {
  if (!el) return;
  el.innerHTML = "";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommentSection({ postId }) {
  const { t } = useSiteLanguage();
  const editorRef = useRef(null);
  const dropdownRef = useRef(null);

  const [image, setImage] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editorEmpty, setEditorEmpty] = useState(true);

  // Mention state
  // mentionActive = true  → we are in @mention mode (even with empty query)
  // mentionQuery          → what the user has typed after @
  // mentionStart          → char offset of the @ sign in the editor text
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Always query – even for empty string – so bare "@" shows all users
  const { data: searchData, isFetching: isSearching } = useSearchUsersQuery(debouncedQuery);
  const suggestions = searchData?.data ?? [];
  const showDropdown = mentionActive && suggestions.length > 0;

  // Instant debounce – update debouncedQuery with no delay
  useEffect(() => {
    setDebouncedQuery(mentionQuery);
  }, [mentionQuery]);

  const { data: commentsData, isLoading } = useGetCommentsQuery({ postId });
  const [addComment, { isLoading: isSubmitting }] = useAddCommentMutation();

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);
  const { showSuccess } = useActionPopup();

  // ── Mention detection ────────────────────────────────────────────────────
  const detectMention = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!range.collapsed) return; // ignore selections, only cursor

    const editor = editorRef.current;
    if (!editor) return;

    // Clone a range from the very start of the editor to the cursor.
    // getTextContent() on that range gives us everything the user typed before cursor.
    const preRange = document.createRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const textBeforeCursor = preRange.toString();

    // Find last unbroken @ that is at start or after whitespace
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

    const query = textBeforeCursor.substring(lastAt + 1);
    if (query.includes(" ") || query.includes("\n")) {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
      return;
    }

    // We're in an active mention!
    setMentionActive(true);
    setMentionQuery(query);
    setMentionStart(lastAt);
    setSelectedIndex(0);
  }, []);

  // ── Editor input handler ─────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    setEditorEmpty(!editorHasContent(editor));
    detectMention();
  }, [detectMention]);

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
      setMentionQuery("");
    }
  }, [mentionActive, suggestions, selectedIndex]);

  const handleSelectUser = (user) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Calculate how many chars the @query occupies (@ + query)
    const queryLen = 1 + mentionQuery.length; // "@" + typed chars
    insertMentionChip(editor, mentionStart, queryLen, user._id, user.fullName);

    setMentionActive(false);
    setMentionQuery("");
    setMentionStart(-1);
    setEditorEmpty(false);
    editor.focus();
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const editor = editorRef.current;
    const textValue = getEditorTextValue(editor);
    if ((!textValue.trim() && !image) || isSubmitting) return;

    try {
      await addComment({
        postId,
        content: textValue,
        parentId: replyingTo?._id,
        images: image ? [image] : [],
      }).unwrap();
      showSuccess(t("community.commentAdded"));
      handleReset();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleReset = () => {
    clearEditor(editorRef.current);
    setEditorEmpty(true);
    setImage(null);
    setShowImageUpload(false);
    setReplyingTo(null);
    setMentionActive(false);
    setMentionQuery("");
    setMentionStart(-1);
  };

  // ── Reply click (from CommentItem) ───────────────────────────────────────
  const handleReplyClick = (comment) => {
    setReplyingTo(comment);
    const editor = editorRef.current;
    if (!editor) return;
    clearEditor(editor);

    // Insert a mention chip for the comment author
    const chip = document.createElement("span");
    chip.dataset.mentionId = comment.author?._id;
    chip.dataset.mentionName = comment.author?.fullName;
    chip.contentEditable = "false";
    chip.className =
      "inline-flex items-center font-semibold text-[#0866FF] cursor-pointer select-none";
    chip.textContent = `@${comment.author?.fullName}`;

    const space = document.createTextNode("\u00A0");
    editor.appendChild(chip);
    editor.appendChild(space);

    // Move cursor to end
    const sel = window.getSelection();
    const range = document.createRange();
    range.setStartAfter(space);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    setEditorEmpty(false);
    editor.focus();
  };

  // ── Comments tree ────────────────────────────────────────────────────────
  const topLevelComments = useMemo(() => {
    const comments = commentsData?.data || [];
    const map = {};
    const roots = [];

    // Initialize map with all comments, adding an empty replies array to each
    comments.forEach((c) => {
      map[c._id] = { ...c, replies: [] };
    });

    // Build the tree
    comments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c._id]);
      } else {
        // If no parentId, or parent not found in this dataset, it's a root
        roots.push(map[c._id]);
      }
    });

    return roots;
  }, [commentsData]);

  // ── Paste handler: strip formatting ──────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          editorRef.current && !editorRef.current.contains(e.target)) {
        setMentionQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown when user clicks Escape anywhere outside
  const handleEditorBlur = useCallback(() => {
    // Small delay so onMouseDown on a suggestion fires first
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setMentionActive(false);
      }
    }, 150);
  }, []);

  return (
    <div className="px-4 py-3 flex flex-col gap-4">
      {/* ── Comment List ── */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <div className="h-4 w-4 border-2 border-[#0866FF] border-t-transparent animate-spin rounded-full" />
            <span className="text-[13px] text-[#65676B]">{t("community.loadingComments")}</span>
          </div>
        ) : topLevelComments.length === 0 ? (
          <p className="text-center text-[13px] text-[#8A8D91] py-4">
            {t("community.noComments")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                replies={comment.replies}
                onReply={handleReplyClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Comment Input at Bottom ── */}
      <div className="flex gap-2.5 items-start pt-3 border-t border-[#E4E6EB]">
        <Avatar
          src={userPhotoUrl}
          name={userDisplayName}
          className="h-8 w-8 rounded-full shrink-0 mt-0.5"
        />
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Replying-to banner */}
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#E7F3FF] rounded-lg text-[12px] text-[#0866FF]">
              <span className="font-medium">
                {t("community.replyingTo", { name: replyingTo.author?.fullName })}
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  clearEditor(editorRef.current);
                  setEditorEmpty(true);
                }}
                className="hover:opacity-70 transition-opacity p-0.5 ml-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Editor box */}
          <div className="relative">
            {/* Contenteditable input */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onKeyUp={detectMention}
              onClick={detectMention}
              onBlur={handleEditorBlur}
              onPaste={handlePaste}
              className="min-h-[36px] max-h-[160px] overflow-y-auto w-full rounded-full bg-[#F0F2F5] px-4 py-[8px] text-[15px] text-[#050505] leading-snug outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#8A8D91] empty:before:pointer-events-none break-words custom-scrollbar"
              data-placeholder={replyingTo ? t("community.replyPlaceholder", { name: replyingTo.author?.fullName }) : t("community.writeComment")}
              style={{ wordBreak: "break-word" }}
            />

            {/* Send button — only when content exists (text or image) */}
            {(!editorEmpty || !!image) && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#0866FF] hover:bg-[#0866FF]/10 rounded-full transition-all disabled:opacity-40"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-[#0866FF] border-t-transparent animate-spin rounded-full" />
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            )}

            {/* @mention suggestion dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute bottom-full left-0 mb-2 w-[280px] rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] border border-[#E4E6EB] overflow-hidden z-[200]"
              >
                <div className="px-3 py-2 border-b border-[#E4E6EB]">
                  <span className="text-[11px] font-bold text-[#8A8D91] uppercase tracking-wider">
                    {t("community.suggestions")}
                    {isSearching && (
                      <span className="ml-2 inline-block h-2 w-2 border border-[#8A8D91] border-t-transparent animate-spin rounded-full align-middle" />
                    )}
                  </span>
                </div>
                <ul className="py-1 max-h-[220px] overflow-y-auto">
                  {suggestions.map((user, idx) => (
                    <li key={user._id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent blurring editor
                          handleSelectUser(user);
                        }}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                          idx === selectedIndex ? "bg-[#F0F2F5]" : "hover:bg-[#F0F2F5]"
                        }`}
                      >
                        <Avatar
                          src={user.profilePhoto?.url}
                          name={user.fullName}
                          className="h-9 w-9 rounded-full shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-semibold text-[#050505] truncate leading-tight">
                            {user.fullName}
                          </span>
                          <span className="text-[12px] text-[#65676B] truncate capitalize">
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

          {/* Image upload (optional) */}
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`flex items-center gap-1.5 text-[12px] font-bold px-2 py-1 rounded-md transition-colors ${
                showImageUpload
                  ? "text-[#0866FF] bg-[#E7F3FF]"
                  : "text-[#65676B] hover:bg-[#F0F2F5]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {t("community.attachPhoto")}
            </button>
          </div>

          {showImageUpload && (
            <div className="rounded-xl border border-dashed border-[#E4E6EB] p-2 bg-[#F7F8FA]">
              <ImageUploadField
                asset={image}
                onChange={setImage}
                folder="community-comments"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
