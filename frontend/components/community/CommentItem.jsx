"use client";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import {
  useLikeCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/lib/features/community/communityApi";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";

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

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showOptions, setShowOptions] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async () => {
    try { await likeComment(comment._id).unwrap(); }
    catch (err) { console.error("Failed to like comment:", err); }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      await updateComment({ commentId: comment._id, content: editContent }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try { await deleteComment(comment._id).unwrap(); }
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
            <span className="block text-[13px] font-bold text-[#050505] leading-tight hover:underline cursor-pointer">
              {comment.author?.fullName}
              {comment.author?.role === "admin" && (
                <span className="ml-1.5 text-[10px] font-bold text-[#0866FF] bg-[#E7F3FF] px-1.5 py-0.5 rounded-full align-middle">
                  Admin
                </span>
              )}
            </span>

            {/* Content or Edit form */}
            {isEditing ? (
              <div className="mt-1.5 space-y-2 min-w-[180px]">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-xl border border-[#E4E6EB] p-2 text-[13.5px] text-[#050505] outline-none focus:ring-1 focus:ring-[#0866FF] resize-none bg-white"
                  rows={2}
                  autoFocus
                />
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
            <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-[#E4E6EB] text-[11px] font-semibold text-[#65676B]">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0866FF]">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
              </span>
              {comment.likesCount}
            </div>
          )}

          {/* Options button (author only) */}
          {isAuthor && !isEditing && (
            <div
              ref={optionsRef}
              className="absolute -right-7 top-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity"
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
                <div className="absolute left-0 top-full mt-1 w-28 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#E4E6EB] py-1 z-30">
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
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-[#E4E6EB]">
            {visibleReplies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} onReply={onReply} />
            ))}
            {replies.length > 2 && (
              <button
                onClick={() => setShowAllReplies((v) => !v)}
                className="text-[12px] font-bold text-[#65676B] hover:underline px-1 py-0.5 mt-0.5"
              >
                {showAllReplies
                  ? "Hide replies"
                  : `View ${replies.length - 2} more repl${replies.length - 2 === 1 ? "y" : "ies"}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
