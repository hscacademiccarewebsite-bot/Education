"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import { ChapterIcon, SubjectIcon } from "@/components/icons/PortalIcons";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput } from "@/components/forms/FloatingField";
import {
  useCreateChapterMutation,
  useDeleteChapterMutation,
  useGetSubjectByIdQuery,
  useListChaptersQuery,
  useUpdateChapterMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { canManageContent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const initialChapterForm = {
  title: "",
};

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

function ChapterDirectoryCard({ chapter, index, canManage, onEdit, onDelete, deletingChapter, t }) {
  return (
    <article className="group rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ChapterIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{t("subjectDetails.chapterCard.unit", "Chapter Unit")}</p>
            <h3 className="mt-1 truncate text-base font-black text-slate-950 md:text-lg">{chapter.title}</h3>
          </div>
        </div>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">{t("subjectDetails.chapterCard.activeNode", "Active Node")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <SubjectIcon className="h-3.5 w-3.5" />
          Subject Layer
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <ChapterIcon className="h-3.5 w-3.5" />
          Chapter Layer
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/chapters/${chapter._id}`} className="site-button-primary px-4 py-2 text-xs">{t("subjectDetails.actions.openChapter", "Open Chapter")}</Link>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(chapter)}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
            >{t("subjectDetails.actions.edit", "Edit")}</button>
            <button
              type="button"
              onClick={() => onDelete(chapter)}
              disabled={deletingChapter}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
            >{t("subjectDetails.actions.delete", "Delete")}</button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function SubjectDetailsPage() {
  const { subjectId } = useParams();
  const { t } = useSiteLanguage();
  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);

  const {
    data: subjectData,
    isLoading: subjectLoading,
    isError: subjectIsError,
    error: subjectError,
  } = useGetSubjectByIdQuery(subjectId, {
    skip: !subjectId,
  });
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    isError: chaptersIsError,
    error: chaptersError,
  } = useListChaptersQuery(subjectId, {
    skip: !subjectId,
  });

  const [createChapter, { isLoading: creatingChapter }] = useCreateChapterMutation();
  const [updateChapter, { isLoading: updatingChapter }] = useUpdateChapterMutation();
  const [deleteChapter, { isLoading: deletingChapter }] = useDeleteChapterMutation();

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterForm, setChapterForm] = useState(initialChapterForm);
  const [editingChapterId, setEditingChapterId] = useState("");
  const [editingChapterTitle, setEditingChapterTitle] = useState("");
  const [chapterMessage, setChapterMessage] = useState("");
  const [chapterError, setChapterError] = useState("");
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();

  const subject = subjectData?.data;
  const chapters = chaptersData?.data || [];
  const managementOpen = canManage && (showChapterForm || Boolean(editingChapterId));

  const openCreatePanel = () => {
    setEditingChapterId("");
    setEditingChapterTitle("");
    setChapterForm(initialChapterForm);
    setShowChapterForm((prev) => !prev || Boolean(editingChapterId));
    setChapterMessage("");
    setChapterError("");
  };

  const openEditChapter = (chapter) => {
    setEditingChapterId(chapter._id);
    setEditingChapterTitle(chapter.title || "");
    setShowChapterForm(false);
    setChapterMessage("");
    setChapterError("");
  };

  const closeManagementPanel = () => {
    setShowChapterForm(false);
    setEditingChapterId("");
    setEditingChapterTitle("");
  };

  const handleCreateChapter = async (event) => {
    event.preventDefault();
    setChapterMessage("");
    setChapterError("");

    if (!chapterForm.title.trim()) {
      const validationMessage = t("subjectDetails.messages.chapterReq", "Chapter title is required.");
      setChapterError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await createChapter({
        subjectId,
        title: chapterForm.title.trim(),
      }).unwrap();

      setChapterMessage(t("subjectDetails.messages.createdSuccess", "Chapter created successfully."));
      showSuccess(t("subjectDetails.messages.createdSuccess", "Chapter created successfully."));
      setChapterForm(initialChapterForm);
      setShowChapterForm(false);
    } catch (createError) {
      const resolvedError = normalizeApiError(createError, "Failed to create chapter.");
      setChapterError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleUpdateChapter = async (event) => {
    event.preventDefault();
    setChapterMessage("");
    setChapterError("");

    if (!editingChapterId || !editingChapterTitle.trim()) {
      const validationMessage = t("subjectDetails.messages.chapterReq", "Chapter title is required.");
      setChapterError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await updateChapter({
        chapterId: editingChapterId,
        subjectId,
        title: editingChapterTitle.trim(),
      }).unwrap();

      setChapterMessage(t("subjectDetails.messages.updatedSuccess", "Chapter updated successfully."));
      showSuccess(t("subjectDetails.messages.updatedSuccess", "Chapter updated successfully."));
      closeManagementPanel();
    } catch (updateError) {
      const resolvedError = normalizeApiError(updateError, "Failed to update chapter.");
      setChapterError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleDeleteChapter = async (chapter) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("subjectDetails.messages.deleteConfirmTitle", `Delete "${chapter.title}"?`, { title: chapter.title }),
      message: t("subjectDetails.messages.deleteConfirmMsg", "All videos inside this chapter will be removed permanently. Type DELETE to continue."),
      approveLabel: t("subjectDetails.messages.deleteBtn", "Delete Chapter"),
    });
    if (!confirmed) {
      return;
    }

    setChapterMessage("");
    setChapterError("");

    try {
      await deleteChapter({
        chapterId: chapter._id,
        subjectId,
      }).unwrap();

      setChapterMessage(t("subjectDetails.messages.deletedSuccess", "Chapter deleted successfully."));
      showSuccess(t("subjectDetails.messages.deletedSuccess", "Chapter deleted successfully."));
      if (editingChapterId === chapter._id) {
        closeManagementPanel();
      }
    } catch (deleteError) {
      const resolvedError = normalizeApiError(deleteError, "Failed to delete chapter.");
      setChapterError(resolvedError);
      showError(resolvedError);
    }
  };

  if (subjectLoading) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <CardSkeleton />
        </section>
      </RequireAuth>
    );
  }

  if (!subject || subjectIsError) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <MessageBanner tone="error">
            {subjectError?.data?.message || t("subjectDetails.messages.notFound", "Subject not found or access denied.")}
          </MessageBanner>
        </section>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <div className="space-y-4">
          <p className="site-kicker">{t("subjectDetails.layout.subject", "Subject")}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[42px]">
            {subject.title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{t("subjectDetails.layout.desc", "Manage chapter structure and keep content flow clean.")}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={subject?.batch ? `/courses/${subject.batch}` : "/courses"}
              className="site-button-secondary"
            >
              Back To Course
            </Link>
            {canManage ? (
              <button type="button" onClick={openCreatePanel} className="site-button-primary">
                {showChapterForm && !editingChapterId ? t("subjectDetails.actions.closePopup", "Close Popup") : t("subjectDetails.actions.createChapter", "Create Chapter")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {chaptersIsError ? (
            <MessageBanner tone="warning">
              {chaptersError?.data?.message || t("subjectDetails.messages.loadError", "Unable to load chapters.")}
            </MessageBanner>
          ) : null}
        </div>

        <div className="mt-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="site-kicker">{t("subjectDetails.layout.chapterDirectory", "Chapter Directory")}</p>
                <h2 className="font-display mt-4 text-3xl font-black text-slate-950">{t("subjectDetails.layout.chapterMap", "Chapter map")}</h2>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {chapters.length} {t("subjectDetails.layout.total", "total")}</p>
            </div>

            {chaptersLoading ? (
              <div className="site-panel rounded-[clamp(8px,5%,12px)] p-5">
                <ListSkeleton rows={3} />
              </div>
            ) : chapters.length === 0 ? (
              <div className="site-panel rounded-[clamp(8px,5%,12px)] px-5 py-12 text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ChapterIcon className="h-6 w-6" />
                </span>
                <p className="font-display mt-4 text-2xl font-black text-slate-950">{t("subjectDetails.layout.noChapters", "No chapters yet")}</p>
                <p className="mt-3 text-sm text-slate-600">
                  Create the first chapter to continue the subject structure.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {chapters.map((chapter, index) => (
                  <ChapterDirectoryCard
                    key={chapter._id}
                    chapter={chapter}
                    index={index}
                    canManage={canManage}
                    onEdit={openEditChapter}
                    onDelete={handleDeleteChapter}
                    deletingChapter={deletingChapter}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {managementOpen ? (
          <div
            className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
            onClick={closeManagementPanel}
          >
            <aside
              className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="site-kicker">{editingChapterId ? t("subjectDetails.layout.updateChapter", "Update Chapter") : t("subjectDetails.actions.createChapter", "Create Chapter")}</p>
                  <h2 className="font-display mt-4 text-2xl font-black text-slate-950 md:text-3xl">
                    {editingChapterId ? t("subjectDetails.layout.editMetadata", "Edit chapter metadata") : t("subjectDetails.layout.registerNew", "Register new chapter")}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Keep chapter naming direct and progression-friendly so students can navigate without ambiguity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeManagementPanel}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close popup"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={editingChapterId ? handleUpdateChapter : handleCreateChapter}
                className="mt-6 space-y-4"
              >
                <FloatingInput
                  required
                  label={t("subjectDetails.layout.chapterTitle", "Chapter Title")}
                  value={editingChapterId ? editingChapterTitle : chapterForm.title}
                  onChange={(event) =>
                    editingChapterId
                      ? setEditingChapterTitle(event.target.value)
                      : setChapterForm({ title: event.target.value })
                  }
                  hint={t("subjectDetails.layout.chapterHint", "e.g., Vector")}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Structure Tip
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Examples: Vector, Work and Power, Thermodynamics, Human Physiology.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={creatingChapter || updatingChapter}
                    className="site-button-primary"
                  >
                    {editingChapterId
                      ? updatingChapter
                        ? t("subjectDetails.actions.saving", "Saving...")
                        : t("subjectDetails.actions.saveChapter", "Save Chapter")
                      : creatingChapter
                      ? t("subjectDetails.actions.creating", "Creating...")
                      : t("subjectDetails.actions.createChapter", "Create Chapter")}
                  </button>
                  <button type="button" onClick={closeManagementPanel} className="site-button-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </aside>
          </div>
        ) : null}
      </section>
      {popupNode}
    </RequireAuth>
  );
}
