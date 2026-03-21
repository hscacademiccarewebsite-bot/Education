"use client";

import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";
import Avatar from "@/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import { bn as bnLocale, enUS } from "date-fns/locale";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function NoteCard({ note, onEdit, onDelete }) {
  const { t, language } = useSiteLanguage();
  const currentUserId = useSelector(selectCurrentUserId);
  const isAuthor = String(note.author?._id) === String(currentUserId);
  const relativeTime = note.createdAt
    ? formatDistanceToNow(new Date(note.createdAt), {
        addSuffix: true,
        locale: language === "bn" ? bnLocale : enUS,
      })
    : t("community.notes.justNow", "just now");

  return (
    <div className="group relative rounded-xl bg-white p-4 border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-indigo-200/50">
      <div className="flex items-start gap-3.5">
        {/* Note Icon/Type indicator */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 shadow-sm border border-emerald-100">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-[15px] font-bold text-slate-900 truncate pr-16 tracking-tight" title={note.title}>
              {note.title}
            </h3>
            
            {isAuthor && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 flex items-center gap-1">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(note)}
                    className="p-1.5 rounded-full hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-all"
                    title={t("community.notes.editNoteButton", "Edit Note")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(note._id)}
                    className="p-1.5 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                    title={t("community.notes.deleteNoteButton", "Delete Note")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {note.description && (
            <p className="text-[13px] text-slate-500 mb-3.5 line-clamp-2 leading-relaxed font-medium">
              {note.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {note.subject && (
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                {note.subject.title}
              </span>
            )}
            {note.topic && (
              <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                {t("community.notes.topicPrefix", "Topic")}: {note.topic}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2.5">
            <div className="flex items-center gap-1.5">
              <Avatar src={note.author?.profilePhoto?.url} name={note.author?.fullName} className="h-4 w-4 rounded-full" />
              <span className="text-[11px] font-bold text-slate-600">{note.author?.fullName}</span>
            </div>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning>
              {relativeTime}
            </span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
              note.privacy === "public" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
            }`}>
              {note.privacy === "public"
                ? t("community.privacy.public", "Public")
                : t("community.privacy.enrolled", "Enrolled Members")}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <a 
          href={note.googleDriveLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
        >
          <span>{t("community.notes.openDrive", "Open in Google Drive")}</span>
          <svg className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
