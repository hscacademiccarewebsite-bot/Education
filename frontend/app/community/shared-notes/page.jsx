"use client";

import React, { useState } from "react";
import { useGetSharedNotesQuery, useDeleteSharedNoteMutation } from "@/lib/features/community/sharedNotesApi";
import NoteCard from "@/components/community/NoteCard";
import CreateSharedNote from "@/components/community/CreateSharedNote";
import { NoteSkeleton } from "@/components/community/CommunitySkeletons";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import {
  selectCurrentUser,
  selectCurrentUserDisplayName,
  selectCurrentUserPhotoUrl,
} from "@/lib/features/user/userSlice";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { getUserDisplayRoleLabel } from "@/lib/utils/roleUtils";

export default function SharedNotesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const { t } = useSiteLanguage();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const { showSuccess, showError, requestDeleteConfirmation } = useActionPopup();

  const currentUser = useSelector(selectCurrentUser);
  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);

  const [page, setPage] = useState(1);
  const { data: notesData, isLoading, isFetching, isError } = useGetSharedNotesQuery({ 
    page, 
    limit: 10
  }, {
    skip: !isAuthenticated,
  });

  const [deleteNote] = useDeleteSharedNoteMutation();

  const notes = notesData?.data || [];
  const hasMore = notesData?.pagination ? notesData.pagination.page < notesData.pagination.pages : false;

  const observer = React.useRef();
  const lastNoteElementRef = React.useCallback(node => {
    if (isLoading || isFetching) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetching, hasMore]);

  const handleEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDelete = async (noteId) => {
    const isConfirmed = await requestDeleteConfirmation(t("community.notes.confirmDelete", "Are you sure you want to delete this note?"));
    if (isConfirmed) {
      try {
        await deleteNote(noteId).unwrap();
        showSuccess(t("community.notes.deleted", "Note deleted successfully."));
      } catch (err) {
        console.error("Failed to delete note:", err);
        showError(err?.data?.message || t("community.notes.deleteFailed", "Failed to delete note. Please try again."));
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  return (
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
              <span className="text-[13px] font-bold">{t("community.feed.backToFeed", "Back to Feed")}</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 justify-center">

            
            {/* Left Sidebar */}
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
                <span className="font-bold text-[15px] text-slate-800">{t("community.feed.backToFeed", "Back to Feed")}</span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-200/50 transition-all">
                <Avatar src={userPhotoUrl} name={userDisplayName} className="h-9 w-9 rounded-full" />
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-800 leading-tight">{userDisplayName}</span>
                  <span className="text-[12px] text-slate-500 font-medium">
                    {getUserDisplayRoleLabel(currentUser, t)}
                  </span>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="w-full max-w-[580px]">
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm border border-slate-200/60">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">{t("community.notes.allSharedTitle", "All Shared Notes")}</h1>
                  <p className="text-slate-500 text-[13px] mt-0.5 font-medium">{t("community.notes.allSharedDescription", "Browse study resources shared by the community.")}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="site-button-primary !py-2 !px-4 !text-[12px] h-fit shadow-md shadow-indigo-100/50"
                >
                  {t("community.notes.shareNewNote", "Share New Note")}
                </button>
              </div>

              <div className="space-y-3.5">
                {isLoading && page === 1 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <NoteSkeleton key={i} />
                  ))
                ) : isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
                    <p className="font-bold text-rose-700 text-sm">{t("community.notes.loadSharedError", "Failed to load shared notes.")}</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="mt-5 font-bold text-lg text-slate-900">{t("community.notes.emptyTitle", "No notes shared yet")}</h3>
                    <p className="mt-1 text-slate-500 font-medium text-sm">{t("community.notes.emptySharedDescription", "Be the first to share a helpful resource!")}</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-5 py-2.5 text-[12.5px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95"
                    >
                      {t("community.notes.shareFirstNote", "Share Your First Note")}
                    </button>
                  </div>
                ) : (
                  <>
                    {notes.map((note, index) => {
                      if (notes.length === index + 1) {
                        return (
                          <div ref={lastNoteElementRef} key={note._id}>
                            <NoteCard 
                              note={note} 
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <NoteCard 
                            key={note._id} 
                            note={note} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        );
                      }
                    })}

                    {isFetching && (
                      Array.from({ length: 2 }).map((_, i) => (
                        <NoteSkeleton key={`skeleton-${i}`} />
                      ))
                    )}

                    {!hasMore && notes.length > 0 && (
                      <div className="py-8 text-center text-slate-500 font-medium text-sm">
                        {t("community.notes.endOfSharedList", "You've seen all the notes for now!")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Spacer */}
            <aside className="hidden xl:block w-[280px]" />

          </div>
      </div>
      <CreateSharedNote 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        note={editingNote}
      />
    </main>
  );
}
