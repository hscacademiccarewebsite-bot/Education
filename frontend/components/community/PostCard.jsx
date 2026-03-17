import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams, useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import { useLikePostMutation, useDeletePostMutation } from "@/lib/features/community/communityApi";
import CommentSection from "./CommentSection";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";

export default function PostCard({ post, onEdit }) {
  const searchParams = useSearchParams();
  const params = useParams();
  const targetPostId = searchParams.get("postId") || params.postId;
  const targetCommentId = searchParams.get("commentId");
  const postRef = useRef(null);
  
  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthor = String(post.author?._id) === String(currentUserId);

  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [showComments, setShowComments] = useState(
    String(post._id) === String(targetPostId) || (!!targetCommentId && String(post._id) === String(targetPostId))
  );
  const [showOptions, setShowOptions] = useState(false);

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

  return (
    <div ref={postRef} className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar
          src={post.author?.profilePhoto?.url}
          name={post.author?.fullName}
          className="h-10 w-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-[14px] font-bold text-slate-800 truncate">
              {post.author?.fullName}
            </h4>
            {post.author?.role && <RoleBadge role={post.author.role} />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[12px] font-medium text-slate-500 hover:underline cursor-pointer">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
            <span className="text-[10px] text-slate-400">•</span>
            <div 
              className="text-slate-400 tooltip-trigger"
              title={post.privacy === "enrolled_members" ? "Enrolled Members" : "Public"}
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
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-32 rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-20 animate-scale-in">
                <button
                  onClick={() => {
                    onEdit && onEdit(post);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  Edit Post
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this post? This will also remove all comments.")) {
                      try {
                        await deletePost(post._id).unwrap();
                      } catch (err) {
                        console.error("Failed to delete post:", err);
                      }
                    }
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-500 hover:bg-red-50"
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 py-2">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
          {post.content}
        </p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="mt-2 border-y border-slate-50">
          <div className={`grid gap-0.5 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={`Post image ${idx + 1}`}
                className="w-full object-cover max-h-[500px]"
              />
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2.5 text-[12px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            {post.likesCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--action-start)]">
                  <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex border-t border-slate-100 mx-4 py-1">
        <button
          onClick={handleLike}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-bold transition-all hover:bg-slate-50 ${
            post.isLiked ? "text-[var(--action-start)]" : "text-slate-600"
          }`}
        >
          <svg
            className={`h-5 w-5 ${post.isLiked ? "fill-current" : "fill-none stroke-current"}`}
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-bold text-slate-600 transition-all hover:bg-slate-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
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
