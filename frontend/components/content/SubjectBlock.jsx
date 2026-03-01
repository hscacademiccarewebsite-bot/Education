"use client";

import { useState } from "react";
import ChapterBlock from "@/components/content/ChapterBlock";
import { InlineLoader } from "@/components/loaders/AppLoader";
import {
  useCreateChapterMutation,
  useListChaptersQuery,
  useUpdateSubjectMutation,
} from "@/lib/features/content/contentApi";

function inputClass() {
  return "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
}

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
    } catch (updateError) {
      setError(updateError?.data?.message || "Failed to update subject.");
      setEditingTitle(subject.title);
    }
  };

  const handleCreateChapter = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!chapterTitle.trim()) {
      setError("Chapter title is required.");
      return;
    }

    try {
      await createChapter({
        subjectId: subject._id,
        title: chapterTitle.trim(),
        description: chapterDescription.trim(),
      }).unwrap();

      setMessage("Chapter added.");
      setChapterTitle("");
      setChapterDescription("");
      setShowChapterComposer(false);
    } catch (createError) {
      setError(createError?.data?.message || "Failed to create chapter.");
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          {canManage ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                className={inputClass()}
                placeholder="Subject title"
              />
              <button
                type="button"
                disabled={updatingSubject}
                onClick={handleSubjectRename}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {updatingSubject ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <h3 className="text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
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
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100"
          >
            {showChapterComposer ? "Close Composer" : "Add Chapter"}
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p> : null}

      {canManage && showChapterComposer ? (
        <form onSubmit={handleCreateChapter} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">New Chapter</p>

          <div className="mt-3 grid gap-2">
            <input
              required
              value={chapterTitle}
              onChange={(event) => setChapterTitle(event.target.value)}
              placeholder="Chapter title"
              className={inputClass()}
            />
            <textarea
              value={chapterDescription}
              onChange={(event) => setChapterDescription(event.target.value)}
              placeholder="Chapter description"
              className={inputClass()}
              rows={3}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={creatingChapter}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {creatingChapter ? "Creating..." : "Create Chapter"}
            </button>
            <button
              type="button"
              onClick={() => setShowChapterComposer(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-white"
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
    </article>
  );
}
