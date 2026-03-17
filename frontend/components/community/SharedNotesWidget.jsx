"use client";

import { useState } from "react";
import { useGetSharedNotesQuery, useDeleteSharedNoteMutation } from "@/lib/features/community/sharedNotesApi";
import CreateSharedNote from "./CreateSharedNote";
import { useSelector } from "react-redux";
import { selectCurrentUserId } from "@/lib/features/user/userSlice";
import { formatDistanceToNow } from "date-fns";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useRouter } from "next/navigation";

export default function SharedNotesWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const currentUserId = useSelector(selectCurrentUserId);
  const { data: notesData, isLoading } = useGetSharedNotesQuery({ page: 1, limit: 3 });
  const [deleteNote] = useDeleteSharedNoteMutation();
  const { showSuccess, showError, requestDeleteConfirmation } = useActionPopup();
  const router = useRouter();

  const notes = notesData?.data || [];

  const handleDelete = async (noteId) => {
    const confirmed = await requestDeleteConfirmation("Are you sure you want to delete this shared note?");
    if (!confirmed) return;

    try {
      await deleteNote(noteId).unwrap();
      showSuccess("Shared note deleted successfully.");
    } catch (err) {
      showError(err?.data?.message || "Failed to delete note. Please try again.");
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  return (
    <div className="border-t border-slate-200/60 pt-5 px-1">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 className="text-[17px] font-bold text-slate-800 tracking-tight">Shared Notes</h4>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-[11px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-tight"
        >
          + Share New
        </button>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-14 rounded-xl bg-slate-50 border border-slate-100" />
          ))
        ) : notes.length === 0 ? (
          <p className="text-[12px] text-slate-500 italic px-2 font-medium">No resources shared yet.</p>
        ) : (
          <>
            {notes.map((note) => (
              <div key={note._id} className="group relative rounded-xl bg-white p-2.5 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-200/50">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors shadow-sm">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h5 className="text-[12.5px] font-bold text-slate-900 truncate tracking-tight" title={note.title}>
                        {note.title}
                      </h5>
                      {note.subject && (
                        <span className="shrink-0 bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                          {note.subject.title}
                        </span>
                      )}
                    </div>

                    {note.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 font-medium mb-1.5 leading-tight">
                        {note.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-1.5 leading-none">
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] whitespace-nowrap" title={note.author?.fullName}>
                        {note.author?.fullName}
                      </span>
                      <span className="flex items-center justify-center h-full">
                        <span className="block h-[2px] w-[2px] rounded-full bg-slate-200" />
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold italic whitespace-nowrap">
                        {note.createdAt ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true }) : "just now"}
                      </span>
                      <span className="flex items-center justify-center h-full">
                        <span className="block h-[2px] w-[2px] rounded-full bg-slate-200" />
                      </span>
                      <a 
                        href={note.googleDriveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10.5px] font-black text-indigo-600 hover:text-indigo-700 transition-colors whitespace-nowrap"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  
                  {String(note.author?._id) === String(currentUserId) && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button 
                        onClick={() => handleEdit(note)}
                        className="p-1.5 rounded-full hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-all"
                        title="Edit note"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(note._id)}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                        title="Delete note"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => router.push("/community/shared-notes")}
              className="w-full mt-3 py-2.5 px-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-[12px] font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <span>See All Shared Notes</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <CreateSharedNote 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        note={editingNote}
      />
    </div>
  );
}
