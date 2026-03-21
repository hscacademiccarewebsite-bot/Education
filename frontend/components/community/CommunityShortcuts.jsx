"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { 
  BookOpen, 
  FileText, 
  User,
} from "lucide-react";
import { communityApi } from "@/lib/features/community/communityApi";
import { sharedNotesApi } from "@/lib/features/community/sharedNotesApi";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function CommunityShortcuts() {
  const { t } = useSiteLanguage();
  const currentUserId = useSelector(selectCurrentUserId);
  const prefetchCommunity = communityApi.usePrefetch("getPosts");
  const prefetchSharedNotes = sharedNotesApi.usePrefetch("getSharedNotes");

  const shortcuts = [
    {
      title: t("community.shortcuts.myNotes", "My Notes"),
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-indigo-50 text-indigo-600",
      path: "/community/my-notes",
      onMouseEnter: () => prefetchSharedNotes({ page: 1, limit: 50, author: "me" }),
    },
    {
      title: t("community.shortcuts.sharedNotes", "Shared Notes"),
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-emerald-50 text-emerald-600",
      path: "/community/shared-notes",
      onMouseEnter: () => prefetchSharedNotes({ page: 1, limit: 10 }),
    },
    {
      title: t("community.shortcuts.profile", "Profile"),
      icon: <User className="h-4 w-4" />,
      color: "bg-sky-50 text-sky-600",
      path: "/profile",
    },
    {
      title: t("community.shortcuts.myPosts", "My Posts"),
      icon: <FileText className="h-4 w-4" />,
      color: "bg-indigo-100 text-indigo-600",
      path: currentUserId ? `/users/${currentUserId}` : "/community",
      onMouseEnter: () =>
        currentUserId ? prefetchCommunity({ page: 1, limit: 10, author: currentUserId }) : undefined,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 lg:hidden">
      {shortcuts.map((shortcut, index) => (
        <Link
          key={index}
          href={shortcut.path}
          onMouseEnter={shortcut.onMouseEnter}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md active:scale-95"
        >

          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:scale-110 ${shortcut.color}`}>
            {shortcut.icon}
          </div>
          <span className="text-center text-[11px] font-bold text-slate-700 leading-tight">
            {shortcut.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
