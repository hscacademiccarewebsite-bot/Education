"use client";

import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Share2, 
  FileText, 
  UserCircle 
} from "lucide-react";

export default function CommunityShortcuts() {
  const router = useRouter();

  const shortcuts = [
    {
      title: "My Notes",
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-indigo-50 text-indigo-600",
      path: "/community/my-notes",
    },
    {
      title: "Shared Notes",
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-emerald-50 text-emerald-600",
      path: "/community/shared-notes",
    },
    {
      title: "My Posts",
      icon: <FileText className="h-4 w-4" />,
      color: "bg-indigo-100 text-indigo-600",
      path: "/community/my-posts",
    },
    {
      title: "Profile",
      icon: <UserCircle className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-600",
      path: "/profile",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 lg:hidden">
      {shortcuts.map((shortcut, index) => (
        <button
          key={index}
          onClick={() => router.push(shortcut.path)}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md active:scale-95"
        >

          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:scale-110 ${shortcut.color}`}>
            {shortcut.icon}
          </div>
          <span className="text-center text-[11px] font-bold text-slate-700 leading-tight">
            {shortcut.title}
          </span>
        </button>
      ))}
    </div>
  );
}

