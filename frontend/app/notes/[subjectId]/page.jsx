"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import { SubjectIcon } from "@/components/icons/PortalIcons";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput } from "@/components/forms/FloatingField";
import SiteFooter from "@/components/layouts/SiteFooter";
import {
  useGetSubjectByIdQuery,
  useListNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { canManageContent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

const initialNoteForm = {
  title: "",
  googleDriveLink: "",
};

function normalizeSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

function MessageBanner({ tone, children }) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>
      {children}
    </div>
  );
}

function NoteCard({ note, canManage, onEdit, onDelete, deletingNote, t }) {
  const isNew = new Date() - new Date(note.createdAt) < 48 * 60 * 60 * 1000;

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 transition-all duration-500 hover:scale-[1.01] hover:border-emerald-500/30 hover:bg-white hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] md:p-5">
      {/* Background Accent */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-50/40 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
      
      <div className="relative flex items-center gap-4">
        {/* Icon Container with Gradient */}
        <div 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-emerald-100 transition-all duration-500 group-hover:scale-110 md:h-13 md:w-13"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <svg className="h-6 w-6 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white shadow-sm ring-1 ring-emerald-500/20">
                {t("notes.card.new", "NEW")}
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/80">
              {t("notes.card.pdf", "PDF")}
            </span>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-200" />
            <span className="text-[9px] font-medium text-slate-400" suppressHydrationWarning>
              {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-[14px] font-bold text-slate-900 transition-colors group-hover:text-emerald-950 sm:text-[15px]">
            {note.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a 
            href={note.googleDriveLink} 
            target="_blank" 
            rel="noreferrer" 
            className="group/btn flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 active:scale-90"
            title={t("notes.actions.download", "Open")}
          >
            <svg className="h-4.5 w-4.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          {canManage && (
            <div className="flex items-center gap-1 border-l border-slate-100 ml-1 pl-1">
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDelete(note)}
                disabled={deletingNote}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.78 0-.34-9m9.92-2.34c.1-.001.24.03.32.128.08.097.09.222.08.351L19 21.01a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1l-1.01-14c-.01-.129.001-.254.08-.351.08-.098.22-.129.32-.128M15 5.03l-.001-.06a2.5 2.5 0 0 0-2.5-2.5H11.5a2.5 2.5 0 0 0-2.5 2.5l.001.06M15 5H9m6 0a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 0-1.5 1.5M15 5l-.01.03M9 5l.01.03" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NotesPage() {
  const { subjectId } = useParams();
  const { t } = useSiteLanguage();
  const isAuthInitialized = useSelector(selectIsAuthInitialized);
  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);

  const {
    data: subjectData,
    isLoading: subjectLoading,
  } = useGetSubjectByIdQuery(subjectId, {
    skip: !subjectId || !isAuthInitialized,
  });
  const {
    data: notesData,
    isLoading: notesLoading,
    isError: notesIsError,
    error: notesError,
  } = useListNotesQuery(subjectId, {
    skip: !subjectId || !isAuthInitialized,
  });

  const [createNote, { isLoading: creatingNote }] = useCreateNoteMutation();
  const [updateNote, { isLoading: updatingNote }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: deletingNote }] = useDeleteNoteMutation();

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState(initialNoteForm);
  const [editingNoteId, setEditingNoteId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [portalMounted, setPortalMounted] = useState(false);
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  const subject = subjectData?.data;
  const notes = notesData?.data || [];
  const managementOpen = canManage && (showNoteForm || Boolean(editingNoteId));
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  const openCreatePanel = () => {
    setEditingNoteId("");
    setNoteForm(initialNoteForm);
    setShowNoteForm(true);
  };

  const openEditNote = (note) => {
    setEditingNoteId(note._id);
    setNoteForm({
      title: note.title,
      googleDriveLink: note.googleDriveLink,
    });
    setShowNoteForm(false);
  };

  const closeManagementPanel = () => {
    setShowNoteForm(false);
    setEditingNoteId("");
    setNoteForm(initialNoteForm);
  };

  const handleCreateNote = async (event) => {
    event.preventDefault();
    if (!noteForm.title.trim() || !noteForm.googleDriveLink.trim()) {
      showError(t("notes.messages.required", "All fields are required."));
      return;
    }

    try {
      await createNote({
        subjectId,
        title: noteForm.title.trim(),
        googleDriveLink: noteForm.googleDriveLink.trim(),
      }).unwrap();

      showSuccess(t("notes.messages.createdSuccess", "Note created successfully."));
      closeManagementPanel();
    } catch (error) {
      showError(normalizeApiError(error, "Failed to create note."));
    }
  };

  const handleUpdateNote = async (event) => {
    event.preventDefault();
    if (!noteForm.title.trim() || !noteForm.googleDriveLink.trim()) {
      showError(t("notes.messages.required", "All fields are required."));
      return;
    }

    try {
      await updateNote({
        noteId: editingNoteId,
        subjectId,
        title: noteForm.title.trim(),
        googleDriveLink: noteForm.googleDriveLink.trim(),
      }).unwrap();

      showSuccess(t("notes.messages.updatedSuccess", "Note updated successfully."));
      closeManagementPanel();
    } catch (error) {
      showError(normalizeApiError(error, "Failed to update note."));
    }
  };

  const handleDeleteNote = async (note) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("notes.messages.deleteConfirmTitle", `Delete "${note.title}"?`),
      message: t("notes.messages.deleteConfirmMsg", "This note will be removed permanently."),
      approveLabel: t("notes.messages.deleteBtn", "Delete Note"),
    });
    if (!confirmed) return;

    try {
      await deleteNote({ noteId: note._id, subjectId }).unwrap();
      showSuccess(t("notes.messages.deletedSuccess", "Note deleted successfully."));
    } catch (error) {
      showError(normalizeApiError(error, "Failed to delete note."));
    }
  };

  const filteredNotes = useMemo(() => {
    if (!normalizedSearchTerm) {
      return notes;
    }

    return notes.filter((note) => {
      const searchableFields = [
        note?.title,
        note?.googleDriveLink,
      ]
        .map((value) => normalizeSearchValue(value))
        .filter(Boolean);

      return searchableFields.some((value) => value.includes(normalizedSearchTerm));
    });
  }, [notes, normalizedSearchTerm]);

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="container-page py-6 sm:py-10">
            <RevealSection noStagger className="space-y-4">
              <RevealItem>
                <p className="site-kicker">{t("notes.layout.notes", "Resource Notes")}</p>
              </RevealItem>
              
              <RevealItem>
                {subjectLoading ? (
                  <div className="h-9 sm:h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
                ) : !subject ? (
                  <MessageBanner tone="error">{t("notes.messages.subjectNotFound", "Subject not found.")}</MessageBanner>
                ) : (
                  <h1 className="font-display bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-[28px] md:text-[36px] leading-[1.2]">
                    {subject.title}
                  </h1>
                )}
              </RevealItem>

              <RevealItem>
                {subjectLoading ? (
                  <div className="space-y-2">
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ) : (
                  <p className="max-w-2xl text-[12px] sm:text-[13px] leading-[1.6] sm:leading-6 text-slate-500">
                    {t("notes.layout.desc", "Access all supplementary materials and notes for this subject.")}
                  </p>
                )}
              </RevealItem>

              <RevealItem className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                {!subject && !subjectLoading ? null : (
                  <>
                    <Link
                      href={subject?.batch ? `/courses/${subject.batch}` : `/courses`}
                      className="site-button-secondary !px-3 !py-1.5 text-[10px] sm:!px-4 sm:!py-2 sm:text-xs"
                    >
                      Back To Course
                    </Link>
                    {canManage && (
                      <button type="button" onClick={openCreatePanel} className="site-button-primary !px-3 !py-1.5 text-[10px] sm:!px-4 sm:!py-2 sm:text-xs">
                        {t("notes.actions.addNote", "Add New Note")}
                      </button>
                    )}
                  </>
                )}
              </RevealItem>
            </RevealSection>

            <div className="mt-10 sm:mt-16 space-y-7 sm:space-y-9">
              <div className="flex flex-col gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="site-kicker">{t("notes.layout.directory", "File Directory")}</p>
                  <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-950">{t("notes.layout.allNotes", "Study Resources")}</h2>
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-md sm:flex-1">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder={t("notes.layout.search", "Search by title...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-11 text-[12px] font-bold text-slate-950 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all sm:text-[13px]"
                    />
                    {searchTerm ? (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
                        aria-label={t("notes.actions.clearSearch", "Clear search")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  {!notesLoading && (
                    <div className="flex items-center justify-between sm:justify-start">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:hidden">
                        {t("notes.layout.matching", "Matching Files")}
                      </p>
                      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 ring-1 ring-slate-200/60">
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {filteredNotes.length}/{notes.length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {notesLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : notesIsError ? (
                <MessageBanner tone="error">
                    {notesError?.data?.message || t("notes.messages.loadError", "Unable to load notes. Access restricted.")}
                  </MessageBanner>
              ) : filteredNotes.length === 0 ? (
                <div className="site-panel group border-slate-200/60 py-20 text-center shadow-sm backdrop-blur-sm">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-50 opacity-20 group-hover:bg-emerald-100" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 transition-all duration-500 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-500">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-display mt-7 text-xl font-black tracking-tight text-slate-950">
                    {searchTerm ? t("notes.layout.noResults", "No matching resources") : t("notes.layout.noNotes", "Resource Library is Empty")}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[12px] font-bold leading-relaxed text-slate-400">
                    {searchTerm 
                      ? t("notes.layout.tryDifferent", "We couldn't find any documents matching your current search. Try refined keywords.") 
                      : t("notes.layout.noNotesDesc", "This study library hasn't been stocked yet. Faculty will upload materials here shortly.")}
                  </p>
                </div>
              ) : (
                <RevealSection className="grid gap-6 lg:grid-cols-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredNotes.map((note) => (
                      <RevealItem key={note._id}>
                        <NoteCard
                          note={note}
                          canManage={canManage}
                          onEdit={openEditNote}
                          onDelete={handleDeleteNote}
                          deletingNote={deletingNote}
                          t={t}
                        />
                      </RevealItem>
                    ))}
                  </AnimatePresence>
                </RevealSection>
              )}
            </div>
          </section>
        </main>

        <SiteFooter />

        {portalMounted && managementOpen ? (
          createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
              onClick={closeManagementPanel}
            >
              <aside
                className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-6 md:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="site-kicker">{editingNoteId ? t("notes.layout.updateNote", "Update Note") : t("notes.layout.addNote", "Add New Note")}</p>
                    <h2 className="font-display mt-3 text-lg font-extrabold text-slate-950 md:text-xl">
                      {editingNoteId ? t("notes.layout.editDetails", "Edit resource details") : t("notes.layout.uploadResource", "Add new study resource")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeManagementPanel}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingNoteId ? handleUpdateNote : handleCreateNote} className="mt-8 space-y-5">
                  <FloatingInput
                    required
                    label={t("notes.layout.titleLabel", "Note Title")}
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    hint="e.g., Chapter 01: Vector Full Lecture Note"
                  />
                  <FloatingInput
                    required
                    label={t("notes.layout.linkLabel", "Google Drive Link")}
                    value={noteForm.googleDriveLink}
                    onChange={(e) => setNoteForm({ ...noteForm, googleDriveLink: e.target.value })}
                    hint="Ensure the link is public or shared with students"
                  />

                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={creatingNote || updatingNote}
                      className="site-button-primary"
                    >
                      {editingNoteId
                        ? updatingNote ? t("notes.actions.saving", "Saving...") : t("notes.actions.save", "Save Changes")
                        : creatingNote ? t("notes.actions.submitting", "Submitting...") : t("notes.actions.add", "Add Note")}
                    </button>
                    <button type="button" onClick={closeManagementPanel} className="site-button-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </aside>
            </div>,
            document.body
          )
        ) : null}
      </div>
      {popupNode}
    </RequireAuth>
  );
}
