"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import PageHero from "@/components/layouts/PageHero";
import { ChapterIcon, SubjectIcon } from "@/components/icons/PortalIcons";
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

const initialChapterForm = {
  title: "",
};

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
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

export default function SubjectDetailsPage() {
  const { subjectId } = useParams();
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
      setChapterError("Chapter title is required.");
      return;
    }

    try {
      await createChapter({
        subjectId,
        title: chapterForm.title.trim(),
      }).unwrap();

      setChapterMessage("Chapter created successfully.");
      setChapterForm(initialChapterForm);
      setShowChapterForm(false);
    } catch (createError) {
      setChapterError(normalizeApiError(createError, "Failed to create chapter."));
    }
  };

  const handleUpdateChapter = async (event) => {
    event.preventDefault();
    setChapterMessage("");
    setChapterError("");

    if (!editingChapterId || !editingChapterTitle.trim()) {
      setChapterError("Chapter title is required.");
      return;
    }

    try {
      await updateChapter({
        chapterId: editingChapterId,
        subjectId,
        title: editingChapterTitle.trim(),
      }).unwrap();

      setChapterMessage("Chapter updated successfully.");
      closeManagementPanel();
    } catch (updateError) {
      setChapterError(normalizeApiError(updateError, "Failed to update chapter."));
    }
  };

  const handleDeleteChapter = async (chapter) => {
    const confirmed = window.confirm(
      `Delete "${chapter.title}"?\n\nAll videos inside this chapter will be removed permanently.`
    );
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

      setChapterMessage("Chapter deleted successfully.");
      if (editingChapterId === chapter._id) {
        closeManagementPanel();
      }
    } catch (deleteError) {
      setChapterError(normalizeApiError(deleteError, "Failed to delete chapter."));
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
            {subjectError?.data?.message || "Subject not found or access denied."}
          </MessageBanner>
        </section>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Subject Operations"
          title={subject.title}
          description="Manage chapter structure with cleaner operational controls and a sequence-ready content directory."
          actions={
            <>
              <Link
                href={subject?.batch ? `/courses/${subject.batch}` : "/courses"}
                className="site-button-secondary"
              >
                Back To Course
              </Link>
              {canManage ? (
                <button type="button" onClick={openCreatePanel} className="site-button-primary">
                  {showChapterForm && !editingChapterId ? "Close Panel" : "Create Chapter"}
                </button>
              ) : null}
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Chapters</p>
                <p className="mt-2 text-3xl font-black text-white">{chapters.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Course Reference</p>
                <p className="mt-2 text-sm font-semibold text-white">{subject?.batchName || "Mapped course"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Delivery Layer</p>
                <p className="mt-2 text-sm font-semibold text-white">Subject -&gt; Chapter -&gt; Video</p>
              </div>
            </div>
          }
          className="overflow-hidden"
        />

        <div className="site-panel-muted mt-6 rounded-[28px] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">Workflow</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Course</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Subject</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Chapter
            </span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Video</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {chapterMessage ? <MessageBanner tone="success">{chapterMessage}</MessageBanner> : null}
          {chapterError ? <MessageBanner tone="error">{chapterError}</MessageBanner> : null}
          {chaptersIsError ? (
            <MessageBanner tone="warning">
              {chaptersError?.data?.message || "Unable to load chapters."}
            </MessageBanner>
          ) : null}
        </div>

        <div className={`mt-8 grid gap-6 ${managementOpen ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="site-kicker">Chapter Directory</p>
                <h2 className="font-display mt-4 text-3xl font-black text-slate-950">Academic structure register</h2>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Enterprise content indexing
              </p>
            </div>

            <div className="site-panel overflow-hidden rounded-[30px]">
              <div className="hidden border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 md:grid md:grid-cols-[56px_minmax(0,1.3fr)_minmax(0,0.9fr)_auto] md:gap-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">No</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Chapter</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Scope</p>
                <p className="text-right text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Actions</p>
              </div>

              {chaptersLoading ? (
                <div className="p-5">
                  <ListSkeleton rows={3} />
                </div>
              ) : chapters.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <SubjectIcon className="h-6 w-6" />
                  </span>
                  <p className="font-display mt-4 text-2xl font-black text-slate-950">No chapters yet</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Create the first chapter to continue the subject structure.
                  </p>
                </div>
              ) : (
                chapters.map((chapter, index) => (
                  <article
                    key={chapter._id}
                    className="border-b border-slate-200/70 px-4 py-4 last:border-b-0 md:px-5"
                  >
                    <div className="grid gap-3 md:grid-cols-[56px_minmax(0,1.3fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-4">
                      <div className="flex items-center gap-3 md:gap-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 md:ml-2">
                          <ChapterIcon className="h-5 w-5" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Chapter</p>
                        <h3 className="mt-1 truncate text-lg font-black text-slate-950">{chapter.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">ID: {chapter._id}</p>
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        Sequence this chapter as a delivery block and manage lecture videos inside it.
                      </p>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Link href={`/chapters/${chapter._id}`} className="site-button-primary px-4 py-2 text-xs">
                          Open Chapter
                        </Link>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditChapter(chapter)}
                              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(chapter)}
                              disabled={deletingChapter}
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {managementOpen ? (
            <aside className="site-panel h-fit rounded-[30px] border border-slate-200 p-5 md:p-6 xl:sticky xl:top-28">
              <p className="site-kicker">{editingChapterId ? "Update Chapter" : "Create Chapter"}</p>
              <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                {editingChapterId ? "Edit chapter metadata" : "Register new chapter"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Keep chapter naming direct and progression-friendly so students can navigate without ambiguity.
              </p>

              <form
                onSubmit={editingChapterId ? handleUpdateChapter : handleCreateChapter}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Chapter Title
                  </label>
                  <input
                    required
                    value={editingChapterId ? editingChapterTitle : chapterForm.title}
                    onChange={(event) =>
                      editingChapterId
                        ? setEditingChapterTitle(event.target.value)
                        : setChapterForm({ title: event.target.value })
                    }
                    placeholder="Vector"
                    className={fieldClass()}
                  />
                </div>

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
                        ? "Saving..."
                        : "Save Chapter"
                      : creatingChapter
                      ? "Creating..."
                      : "Create Chapter"}
                  </button>
                  <button type="button" onClick={closeManagementPanel} className="site-button-secondary">
                    Close
                  </button>
                </div>
              </form>
            </aside>
          ) : null}
        </div>
      </section>
    </RequireAuth>
  );
}
