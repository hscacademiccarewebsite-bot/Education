import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { bn as bnLocale, enUS } from "date-fns/locale";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import { useLikePostMutation, useDeletePostMutation } from "@/lib/features/community/communityApi";
import CommentSection from "./CommentSection";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import PhotoViewer from "@/components/shared/PhotoViewer";

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
      <Link
        key={`mention-${match.index}`}
        href={`/users/${match[1]}`}
        className="font-semibold text-[#0866FF] hover:underline cursor-pointer"
      >
        @{match[2]}
      </Link>
    );

    lastIndex = mentionRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key="txt-end">{content.substring(lastIndex)}</span>);
  }

  return parts;
}

export default function PostCard({ post, onEdit, compact = false }) {
  const { t, language } = useSiteLanguage();
  const searchParams = useSearchParams();
  const params = useParams();
  const targetPostId = searchParams.get("postId") || params.postId;
  const targetCommentId = searchParams.get("commentId");
  const postRef = useRef(null);
  
  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthor = String(post.author?._id) === String(currentUserId);

  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const { showSuccess, requestDeleteConfirmation } = useActionPopup();
  const [showComments, setShowComments] = useState(
    String(post._id) === String(targetPostId) || (!!targetCommentId && String(post._id) === String(targetPostId))
  );
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (String(post._id) === String(targetPostId)) {
      setShowComments(true);
      // Short delay to allow for page layout / other scrolls
      setTimeout(() => {
        postRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [targetPostId, post._id]);

  const handleLike = async () => {
    try {
      await likePost(post._id).unwrap();
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const cardClassName = compact
    ? "mb-3 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
    : "mb-4 rounded-xl lg:rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md";
  const headerClassName = compact ? "flex items-center gap-2.5 p-2.5 pb-1.5" : "flex items-center gap-3 p-4 pb-2";
  const avatarClassName = compact ? "h-8.5 w-8.5 rounded-full" : "h-10 w-10 rounded-full";
  const authorClassName = compact
    ? "font-display text-[12px] font-semibold text-slate-800 truncate hover:underline"
    : "font-display text-[14px] font-bold text-slate-800 truncate hover:underline";
  const metaClassName = compact
    ? "mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-500"
    : "flex items-center gap-1.5 mt-0.5";
  const contentWrapClassName = compact ? "px-2.5 pb-1.5 pt-1" : "px-4 py-2";
  const contentTextClassName = compact
    ? "whitespace-pre-wrap text-[12px] leading-[1.5] text-slate-700"
    : "whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700";
  const imageClassName = compact
    ? "w-full object-cover max-h-[320px] transition-transform duration-300 group-hover:scale-[1.02]"
    : "w-full object-cover max-h-[500px] transition-transform duration-300 group-hover:scale-[1.02]";
  const statsClassName = compact
    ? "flex items-center justify-between px-2.5 py-1.5 text-[10px] font-medium text-slate-500"
    : "flex items-center justify-between px-4 py-2.5 text-[12px] font-medium text-slate-500";
  const statsIconWrapClassName = compact
    ? "flex h-3 w-3 items-center justify-center rounded-full bg-[var(--action-start)]"
    : "flex h-4 w-4 items-center justify-center rounded-full bg-[var(--action-start)]";
  const statsIconClassName = compact ? "h-1.5 w-1.5 text-white" : "h-2.5 w-2.5 text-white";
  const actionsWrapClassName = compact ? "mx-2.5 flex border-t border-slate-100 py-0.5" : "flex border-t border-slate-100 mx-4 py-1";
  const actionButtonClassName = compact
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all hover:bg-slate-50"
    : "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-bold transition-all hover:bg-slate-50";
  const likeIconClassName = compact ? "h-3.5 w-3.5" : "h-5 w-5";
  const commentIconClassName = compact ? "h-3.5 w-3.5" : "h-5 w-5";
  const relativeTime = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: language === "bn" ? bnLocale : enUS,
  });

  return (
    <div ref={postRef} className={cardClassName}>

      {/* Post Header */}
      <div className={headerClassName}>
        <Link href={`/users/${post.author?._id || ""}`} className="shrink-0">
          <Avatar
            src={post.author?.profilePhoto?.url}
            name={post.author?.fullName}
            className={avatarClassName}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link
              href={`/users/${post.author?._id || ""}`}
              className={authorClassName}
            >
              {post.author?.fullName}
            </Link>
            {post.author?.role && <RoleBadge role={post.author.role} />}
          </div>

          <div className={metaClassName}>
            <p
              className={`${compact ? "" : "text-[12px] font-medium"} text-slate-500 hover:underline cursor-pointer`}
              suppressHydrationWarning
            >
              {relativeTime}
            </p>
            <span className="text-[10px] text-slate-400">•</span>
            <div 
              className="text-slate-400 tooltip-trigger"
              title={post.privacy === "enrolled_members" ? t("community.privacy.enrolled") : t("community.privacy.public")}
            >
              {post.privacy === "enrolled_members" ? (
                <svg className="h-[13px] w-[13px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              ) : (
                <svg className="h-[13px] w-[13px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Options Menu (Three Dots) - Only for author */}
        {isAuthor && (
          <div className="relative" ref={optionsRef}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className={`${compact ? "p-1.5" : "p-2"} rounded-full hover:bg-slate-100 text-slate-400 transition-colors`}
            >
              <svg className={compact ? "h-4 w-4" : "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className={`absolute right-0 mt-1 ${compact ? "w-28" : "w-32"} rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-20 animate-scale-in`}>
                {onEdit ? (
                  <button
                    onClick={() => {
                      onEdit(post);
                      setShowOptions(false);
                    }}
                    className={`w-full text-left ${compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"} ${compact ? "font-semibold" : "font-bold"} text-slate-600 hover:bg-slate-50`}
                  >
                    {t("community.editPost")}
                  </button>
                ) : null}
                <button
                  onClick={async () => {
                    setShowOptions(false);
                    const confirmed = await requestDeleteConfirmation({
                      title: t("community.deleteConfirmTitle"),
                      message: t("community.deleteConfirmMsg"),
                      approveLabel: t("community.deleteApprove")
                    });

                    if (confirmed) {
                      try {
                        await deletePost(post._id).unwrap();
                        showSuccess(t("community.postDeleted"));
                      } catch (err) {
                        console.error("Failed to delete post:", err);
                      }
                    }
                  }}
                  className={`w-full text-left ${compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"} ${compact ? "font-semibold" : "font-bold"} text-red-500 hover:bg-red-50`}
                >
                  {t("community.deletePost")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className={contentWrapClassName}>
        <p className={contentTextClassName}>
          {renderContent(post.content)}
        </p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="mt-2 border-y border-slate-50 overflow-hidden">
          <div className={`grid gap-0.5 ${
            post.images.length === 1 ? "grid-cols-1" :
            post.images.length === 3 ? "grid-cols-3" :
            "grid-cols-2"
          }`}>
            {post.images.slice(0, 4).map((img, idx) => {
              const isLast = idx === 3 && post.images.length > 4;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setViewerStartIndex(idx); setViewerOpen(true); }}
                  className="relative w-full overflow-hidden focus:outline-none group"
                >
                  <img
                    src={img.url}
                    alt={t("community.postImageAlt", "Post image {number}", { number: idx + 1 })}
                    className={imageClassName}
                    style={{ aspectRatio: post.images.length === 1 ? "auto" : "1 / 1" }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
                  {/* +N badge on last tile if images > 4 */}
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo Viewer */}
      <PhotoViewer
        images={post.images || []}
        startIndex={viewerStartIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      {/* Post Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className={statsClassName}>
          <div className="flex items-center gap-1.5">
            {post.likesCount > 0 && (
              <div className="flex items-center gap-1">
                <div className={statsIconWrapClassName}>
                  <svg className={statsIconClassName} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span>{post.likesCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.commentsCount > 0 && (
              <button 
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.commentsCount} {post.commentsCount === 1 ? t("community.comment") : t("community.comments")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className={actionsWrapClassName}>
        <button
          onClick={handleLike}
          className={`${actionButtonClassName} ${
            post.isLiked ? "text-[var(--action-start)]" : "text-slate-600"
          }`}
        >
          <svg
            className={`${likeIconClassName} ${post.isLiked ? "fill-current" : "fill-none stroke-current"}`}
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {t("community.like")}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`${actionButtonClassName} text-slate-600`}
        >
          <svg className={commentIconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {t("community.comment")}
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
}
