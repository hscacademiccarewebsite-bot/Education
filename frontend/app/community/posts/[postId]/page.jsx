"use client";

import { useGetPostByIdQuery } from "@/lib/features/community/communityApi";
import PostCard from "@/components/community/PostCard";
import Avatar from "@/components/Avatar";
import { useSelector } from "react-redux";
import { 
  selectCurrentUser,
  selectCurrentUserDisplayName, 
  selectCurrentUserPhotoUrl, 
} from "@/lib/features/user/userSlice";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { getUserDisplayRoleLabel } from "@/lib/utils/roleUtils";

export default function SinglePostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { t } = useSiteLanguage();
  
  const currentUser = useSelector(selectCurrentUser);
  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);

  const { data: postData, isLoading, isError } = useGetPostByIdQuery(postId);

  const post = postData?.data;

  return (
    <main className="site-nav-offset min-h-screen bg-[#F0F2F5] pb-12">
      <div className="container-page py-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-center">
          
          {/* Left Sidebar - Profile & Shortcuts */}
          <aside className="hidden lg:block w-[280px] space-y-2 sticky top-[100px] h-fit">
             <Link href="/community">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="font-bold text-[15px] text-slate-700">Back to Feed</span>
              </div>
            </Link>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-200/50 transition-all">
              <Avatar src={userPhotoUrl} name={userDisplayName} className="h-9 w-9 rounded-full" />
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-slate-800 leading-tight">{userDisplayName}</span>
                <span className="text-[12px] text-slate-500 font-medium">
                  {getUserDisplayRoleLabel(currentUser, t)}
                </span>
              </div>
            </div>
            
            <div className="pt-4 px-2">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shortcuts</h4>
              <div className="space-y-1">
                <div 
                  onClick={() => router.push("/notes")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer text-slate-600"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-bold text-[14px]">My Notes</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="w-full max-w-[680px]">
            {isLoading ? (
              <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 h-96 shadow-sm" />
            ) : isError || !post ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-rose-800">Post not found</h3>
                <p className="mt-2 text-rose-600">The post you're looking for might have been deleted or moved.</p>
                <button 
                  onClick={() => router.push("/community")}
                  className="mt-6 px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Return to Community
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <PostCard post={post} />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
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
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
