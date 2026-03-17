"use client";
import React, { useState } from "react";
import { useGetPostsQuery } from "@/lib/features/community/communityApi";
import PostCard from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import RequireAuth from "@/components/RequireAuth";
import Avatar from "@/components/Avatar";
import { selectCurrentUserDisplayName, selectCurrentUserPhotoUrl, selectCurrentUserRole } from "@/lib/features/user/userSlice";

export default function MyPostsPage() {
  const [editingPost, setEditingPost] = useState(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);
  const userRole = useSelector(selectCurrentUserRole);

  const [page, setPage] = useState(1);
  const { data: postsData, isLoading, isFetching, isError } = useGetPostsQuery({ 
    page, 
    limit: 10,
    author: "me" 
  }, {
    skip: !isAuthenticated,
  });

  const posts = postsData?.data || [];
  const hasMore = postsData?.pagination ? postsData.pagination.page < postsData.pagination.pages : false;

  const observer = React.useRef();
  const lastPostElementRef = React.useCallback(node => {
    if (isLoading || isFetching) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetching, hasMore]);

  return (
    <RequireAuth>
      <main className="site-nav-offset min-h-screen bg-[#F0F2F5] pb-12">
        <div className="container-page py-4 lg:py-6">
          {/* Mobile Back Button */}
          <div className="mb-4 lg:hidden">
            <button 
              onClick={() => router.push("/community")}
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 group-active:scale-95 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="text-[13px] font-bold">Back to Feed</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 justify-center">

            
            {/* Left Sidebar - Profile & Shortcuts (Hidden on Mobile) */}
            <aside className="hidden lg:block w-[280px] space-y-2 sticky top-[100px] h-fit">
              <div 
                onClick={() => router.push("/community")}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm group-hover:bg-[#E7F3FF] transition-colors">
                  <svg className="h-5 w-5 text-[#65676B] group-hover:text-[#0866FF]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
                  </svg>
                </div>
                <span className="font-bold text-[15px] text-slate-800">Back to Feed</span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-200/50 transition-all">
                <Avatar src={userPhotoUrl} name={userDisplayName} className="h-9 w-9 rounded-full" />
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-800 leading-tight">{userDisplayName}</span>
                  <span className="text-[12px] text-slate-500 font-medium capitalize">{userRole}</span>
                </div>
              </div>
            </aside>

            {/* Main Feed */}
            <div className="w-full max-w-[580px]">
              <div className="mb-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Your Posts</h1>
                <p className="text-slate-500 text-sm mt-1">Manage all the content you've shared with the community.</p>
              </div>

              {/* Hidden Edit Modal Coordinated via State */}
              {editingPost && (
                <CreatePost 
                  post={editingPost} 
                  isOpen={!!editingPost} 
                  onClose={() => setEditingPost(null)}
                  isTriggerVisible={false}
                />
              )}

              <div className="space-y-4">
                {isLoading && page === 1 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 h-64 shadow-sm" />
                  ))
                ) : isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
                    <p className="font-bold text-rose-700">Failed to load your posts.</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-slate-800">You haven't posted yet</h3>
                    <p className="mt-2 text-slate-500">Go back to the feed to spark a conversation!</p>
                  </div>
                ) : (
                  <>
                    {posts.map((post, index) => {
                      if (posts.length === index + 1) {
                        return (
                          <div ref={lastPostElementRef} key={post._id}>
                            <PostCard 
                              post={post} 
                              onEdit={(post) => setEditingPost(post)}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <PostCard 
                            key={post._id} 
                            post={post} 
                            onEdit={(post) => setEditingPost(post)}
                          />
                        );
                      }
                    })}

                    {isFetching && (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 h-64 shadow-sm" />
                      ))
                    )}

                    {!hasMore && posts.length > 0 && (
                      <div className="py-8 text-center">
                        <p className="text-slate-500 font-medium">You've caught up with all your posts!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Spacer (Hidden on Mobile) */}
            <aside className="hidden xl:block w-[280px]" />

          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
