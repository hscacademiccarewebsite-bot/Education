"use client";

import { useMemo, useState } from "react";
import { InlineLoader } from "@/components/loaders/AppLoader";
import {
  useCreateVideoMutation,
  useListVideosQuery,
  useUpdateChapterMutation,
} from "@/lib/features/content/contentApi";

function inputClass() {
  return "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
}

export default function ChapterBlock({ chapter, canManage }) {
  const { data, isLoading } = useListVideosQuery(chapter._id);
  const [updateChapter, { isLoading: updatingChapter }] = useUpdateChapterMutation();
  const [createVideo, { isLoading: creatingVideo }] = useCreateVideoMutation();

  const [editingTitle, setEditingTitle] = useState(chapter.title);
  const [showVideoComposer, setShowVideoComposer] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [facebookVideoId, setFacebookVideoId] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const videos = data?.data || [];

  const previewVideoUrl = useMemo(() => {
    const id = facebookVideoId.trim();
    if (!id) {
      return "";
    }
    return `https://www.facebook.com/watch/?v=${id}`;
  }, [facebookVideoId]);

  const handleChapterRename = async () => {
    if (!editingTitle.trim() || editingTitle.trim() === chapter.title) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await updateChapter({
        chapterId: chapter._id,
        title: editingTitle.trim(),
      }).unwrap();

      setMessage("Chapter updated.");
    } catch (updateError) {
      setError(updateError?.data?.message || "Failed to update chapter.");
      setEditingTitle(chapter.title);
    }
  };

  const handleCreateVideo = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!videoTitle.trim() || !facebookVideoId.trim()) {
      setError("Video title and Facebook video ID are required.");
      return;
    }

    try {
      await createVideo({
        chapterId: chapter._id,
        title: videoTitle.trim(),
        facebookVideoId: facebookVideoId.trim(),
        description: videoDescription.trim(),
      }).unwrap();

      setMessage("Video added.");
      setVideoTitle("");
      setFacebookVideoId("");
      setVideoDescription("");
      setShowVideoComposer(false);
    } catch (createError) {
      setError(createError?.data?.message || "Failed to add video.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canManage ? (
          <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              className={inputClass()}
              placeholder="Chapter title"
            />
            <button
              type="button"
              disabled={updatingChapter}
              onClick={handleChapterRename}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {updatingChapter ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <h5 className="text-sm font-bold text-slate-900">{chapter.title}</h5>
        )}

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setShowVideoComposer((prev) => !prev);
              setMessage("");
              setError("");
            }}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-sky-700 transition hover:bg-sky-100"
          >
            {showVideoComposer ? "Close" : "Add Video"}
          </button>
        ) : null}
      </div>

      {chapter.description ? <p className="mt-2 text-xs text-slate-600">{chapter.description}</p> : null}

      {message ? <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p> : null}

      {canManage && showVideoComposer ? (
        <form onSubmit={handleCreateVideo} className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">New Video</p>

          <div className="mt-2 grid gap-2">
            <input
              required
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              placeholder="Video title"
              className={inputClass()}
            />
            <input
              required
              value={facebookVideoId}
              onChange={(event) => setFacebookVideoId(event.target.value)}
              placeholder="Facebook video ID"
              className={inputClass()}
            />
            <textarea
              value={videoDescription}
              onChange={(event) => setVideoDescription(event.target.value)}
              placeholder="Video description"
              className={inputClass()}
              rows={2}
            />
          </div>

          {previewVideoUrl ? (
            <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-[11px] font-semibold text-sky-700">
              Generated URL: {previewVideoUrl}
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={creatingVideo}
              className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {creatingVideo ? "Adding..." : "Add Video"}
            </button>
            <button
              type="button"
              onClick={() => setShowVideoComposer(false)}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <InlineLoader label="Loading videos..." />
        ) : videos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            No videos yet.
          </p>
        ) : (
          videos.map((video) => (
            <article key={video._id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{video.title}</p>
                {video.facebookVideoUrl || video.facebookVideoId ? (
                  <a
                    href={video.facebookVideoUrl || `https://www.facebook.com/watch/?v=${video.facebookVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Open Video
                  </a>
                ) : null}
              </div>

              {video.facebookVideoId ? (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">ID: {video.facebookVideoId}</p>
              ) : null}

              {video.description ? <p className="mt-1 text-xs text-slate-600">{video.description}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
