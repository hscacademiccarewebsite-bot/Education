"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardLoader } from "@/components/loaders/AppLoader";
import { ChapterIcon } from "@/components/icons/PortalIcons";
import {
  useCreateChapterMutation,
  useDeleteChapterMutation,
  useGetSubjectByIdQuery,
  useListChaptersQuery,
  useUpdateChapterMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { canManageContent } from "@/lib/utils/roleUtils";

const initialChapterForm = {
  title: "",
};

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
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
      setChapterError(createError?.data?.message || "Failed to create chapter.");
    }
  };

  const openEditChapter = (chapter) => {
    setEditingChapterId(chapter._id);
    setEditingChapterTitle(chapter.title || "");
    setChapterMessage("");
    setChapterError("");
  };

  const closeEditChapter = () => {
    setEditingChapterId("");
    setEditingChapterTitle("");
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
      closeEditChapter();
    } catch (updateError) {
      setChapterError(updateError?.data?.message || "Failed to update chapter.");
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
        closeEditChapter();
      }
    } catch (deleteError) {
      setChapterError(deleteError?.data?.message || "Failed to delete chapter.");
    }
  };

  if (subjectLoading) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <CardLoader label="Loading subject..." />
        </section>
      </RequireAuth>
    );
  }

  if (!subject || subjectIsError) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {subjectError?.data?.message || "Subject not found or access denied."}
          </div>
        </section>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <section className="container-page py-8">
        <div className="mb-5">
          <Link
            href={subject?.batch ? `/courses/${subject.batch}` : "/courses"}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
          >
            Back to Course
          </Link>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Chapters
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {subject.title}
              </p>
            </div>

            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setShowChapterForm((prev) => !prev);
                  setChapterMessage("");
                  setChapterError("");
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700"
              >
                {showChapterForm ? "Close Form" : "Create Chapter"}
              </button>
            ) : null}
          </div>

          {chapterMessage ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {chapterMessage}
            </p>
          ) : null}
          {chapterError ? (
            <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {chapterError}
            </p>
          ) : null}

          {canManage && showChapterForm ? (
            <form
              onSubmit={handleCreateChapter}
              className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50 p-4"
            >
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Chapter Title
              </label>
              <input
                required
                value={chapterForm.title}
                onChange={(event) => setChapterForm({ title: event.target.value })}
                placeholder="Vector"
                className={fieldClass()}
              />

              <button
                type="submit"
                disabled={creatingChapter}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {creatingChapter ? "Creating..." : "Create Chapter"}
              </button>
            </form>
          ) : null}

          {chaptersLoading ? (
            <CardLoader label="Loading chapters..." />
          ) : chaptersIsError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {chaptersError?.data?.message || "Unable to load chapters."}
            </div>
          ) : chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No chapters yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter, index) => (
                <article
                  key={chapter._id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />

                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700">
                    <ChapterIcon className="h-5 w-5" />
                  </span>

                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Chapter {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                    {chapter.title}
                  </h3>

                  {editingChapterId === chapter._id && canManage ? (
                    <form onSubmit={handleUpdateChapter} className="mt-4 space-y-2">
                      <input
                        required
                        value={editingChapterTitle}
                        onChange={(event) => setEditingChapterTitle(event.target.value)}
                        className={fieldClass()}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={updatingChapter}
                          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                        >
                          {updatingChapter ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={closeEditChapter}
                          className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/chapters/${chapter._id}`}
                        className="inline-flex rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition group-hover:bg-slate-50"
                      >
                        Open Chapter
                      </Link>

                      {canManage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditChapter(chapter)}
                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-cyan-700 transition hover:bg-cyan-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(chapter)}
                            disabled={deletingChapter}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}
