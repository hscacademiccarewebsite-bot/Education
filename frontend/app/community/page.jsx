"use client";
import React, { useState } from "react";
import { useGetPostsQuery } from "@/lib/features/community/communityApi";
import CreatePost from "@/components/community/CreatePost";
import PostCard from "@/components/community/PostCard";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Avatar from "@/components/Avatar";
import { selectCurrentUserDisplayName, selectCurrentUserPhotoUrl, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import RoleBadge from "@/components/RoleBadge";
import RequireAuth from "@/components/RequireAuth";
import SharedNotesWidget from "@/components/community/SharedNotesWidget";
import CommunityShortcuts from "@/components/community/CommunityShortcuts";


export default function CommunityPage() {
  const [editingPost, setEditingPost] = useState(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const router = useRouter();

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);
  const userRole = useSelector(selectCurrentUserRole);

  const [page, setPage] = useState(1);
  const { data: postsData, isLoading, isFetching, isError } = useGetPostsQuery({ page, limit: 10 }, {
    skip: !isAuthenticated,
  });

  const posts = postsData?.data || [];
  const hasMore = postsData?.pagination ? postsData.pagination.page < postsData.pagination.pages : false;

  // Infinite scroll observer
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
        <div className="container-page py-4 lg:py-8">

          <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">

          
          {/* Left Sidebar - Profile & Shortcuts (Hidden on Mobile) */}
          <aside className="hidden lg:block w-[280px] space-y-2 sticky top-[100px] h-fit">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-200/50 transition-all cursor-pointer">
              <Avatar src={userPhotoUrl} name={userDisplayName} className="h-9 w-9 rounded-full" />
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-slate-800 leading-tight">{userDisplayName}</span>
                <span className="text-[12px] text-slate-500 font-medium capitalize">{userRole}</span>
              </div>
            </div>
            
            <div className="pt-4 px-2">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shortcuts</h4>
              <div className="space-y-1">
                <div 
                  onClick={() => router.push("/community/my-notes")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer text-slate-600"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-bold text-[14px]">My Notes</span>
                </div>
                <div 
                  onClick={() => router.push("/community/shared-notes")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer text-slate-600"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-bold text-[14px]">Shared Notes</span>
                </div>
                <div 
                  onClick={() => router.push("/community/my-posts")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer text-slate-600"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className="font-bold text-[14px]">My Posts</span>
                </div>
                <div 
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer text-slate-600"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-bold text-[14px]">Profile</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="w-full max-w-[580px] space-y-4 lg:space-y-6">
            <CreatePost />
            <CommunityShortcuts />


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
                  <p className="font-bold text-rose-700">Failed to load posts. Please try again later.</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-slate-800">No posts yet</h3>
                  <p className="mt-2 text-slate-500">Be the first to share something with the community!</p>
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

                  {(isFetching) && (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 h-64 shadow-sm" />
                    ))
                  )}

                  {!hasMore && posts.length > 0 && (
                    <div className="py-8 text-center">
                      <p className="text-slate-500 font-medium">You've reached the end of the line. No more posts for now!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - Sponsored / Contacts (Hidden on Mobile) */}
          <aside className="hidden xl:block w-[280px] space-y-4 sticky top-[100px] h-fit">
            <div>
              <h4 className="px-2 text-[17px] font-bold text-slate-500 mb-2">Community Guidelines</h4>
              <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
                <ul className="space-y-3 text-[13px] text-slate-600 font-medium">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    Be respectful to others
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    Share educational content
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    Ask questions clearly
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-black">✓</span>
                    Help fellow students
                  </li>
                </ul>
              </div>
            </div>
            
            <SharedNotesWidget />
          </aside>

        </div>
      </div>
    </main>
    </RequireAuth>
  );
}
