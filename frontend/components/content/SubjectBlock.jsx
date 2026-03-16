"use client";

import { useState } from "react";
import ChapterBlock from "@/components/content/ChapterBlock";
import { InlineLoader } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
import {
  useCreateChapterMutation,
  useListChaptersQuery,
  useUpdateSubjectMutation,
} from "@/lib/features/content/contentApi";

export default function SubjectBlock({ subject, canManage }) {
  const { data, isLoading } = useListChaptersQuery(subject._id);
  const [updateSubject, { isLoading: updatingSubject }] = useUpdateSubjectMutation();
  const [createChapter, { isLoading: creatingChapter }] = useCreateChapterMutation();

  const [editingTitle, setEditingTitle] = useState(subject.title);
  const [showChapterComposer, setShowChapterComposer] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();

  const chapters = data?.data || [];

  const handleSubjectRename = async () => {
    if (!editingTitle.trim() || editingTitle.trim() === subject.title) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await updateSubject({
        subjectId: subject._id,
        title: editingTitle.trim(),
      }).unwrap();

      setMessage("Subject updated.");
      showSuccess("Subject updated.");
    } catch (updateError) {
      const resolvedError = updateError?.data?.message || "Failed to update subject.";
      setError(resolvedError);
      showError(resolvedError);
      setEditingTitle(subject.title);
    }
  };

  const handleCreateChapter = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!chapterTitle.trim()) {
      const validationMessage = "Chapter title is required.";
      setError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await createChapter({
        subjectId: subject._id,
        title: chapterTitle.trim(),
        description: chapterDescription.trim(),
      }).unwrap();

      setMessage("Chapter added.");
      showSuccess("Chapter added.");
      setChapterTitle("");
      setChapterDescription("");
      setShowChapterComposer(false);
    } catch (createError) {
      const resolvedError = createError?.data?.message || "Failed to create chapter.";
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <article className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.11)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          {canManage ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <FloatingInput
                label="Subject title"
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                className="min-w-0"
              />
              <button
                type="button"
                disabled={updatingSubject}
                onClick={handleSubjectRename}
                className="site-button-primary h-[52px] self-start rounded-lg px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {updatingSubject ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <h3 className="text-xl font-extrabold text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              {subject.title}
            </h3>
          )}

          {subject.description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{subject.description}</p>
          ) : null}
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setShowChapterComposer((prev) => !prev);
              setMessage("");
              setError("");
            }}
            className="site-button-secondary self-start rounded-lg px-3.5 py-2 text-xs sm:self-end"
          >
            {showChapterComposer ? "Close Composer" : "Add Chapter"}
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p> : null}

      {canManage && showChapterComposer ? (
        <form onSubmit={handleCreateChapter} className="mt-4 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">New Chapter</p>

          <div className="mt-3 grid gap-2">
            <FloatingInput
              required
              label="Chapter title"
              value={chapterTitle}
              onChange={(event) => setChapterTitle(event.target.value)}
            />
            <FloatingTextarea
              label="Chapter description"
              value={chapterDescription}
              onChange={(event) => setChapterDescription(event.target.value)}
              rows={3}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={creatingChapter}
              className="site-button-primary rounded-lg px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {creatingChapter ? "Creating..." : "Create Chapter"}
            </button>
            <button
              type="button"
              onClick={() => setShowChapterComposer(false)}
              className="site-button-secondary rounded-lg px-4 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <InlineLoader label="Loading chapters..." />
        ) : chapters.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            No chapters yet.
          </p>
        ) : (
          chapters.map((chapter) => (
            <ChapterBlock key={chapter._id} chapter={chapter} canManage={canManage} />
          ))
        )}
      </div>
      {popupNode}
    </article>
  );
}
