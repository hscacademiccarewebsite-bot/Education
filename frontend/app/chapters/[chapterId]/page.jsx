"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardLoader } from "@/components/loaders/AppLoader";
import { VideoIcon } from "@/components/icons/PortalIcons";
import {
  useCreateVideoMutation,
  useDeleteVideoMutation,
  useGetChapterByIdQuery,
  useListVideosQuery,
  useUpdateVideoMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { canManageContent } from "@/lib/utils/roleUtils";

const initialVideoForm = {
  title: "",
  facebookVideoId: "",
  description: "",
};

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
}

export default function ChapterDetailsPage() {
  const { chapterId } = useParams();
  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);

  const {
    data: chapterData,
    isLoading: chapterLoading,
    isError: chapterIsError,
    error: chapterError,
  } = useGetChapterByIdQuery(chapterId, {
    skip: !chapterId,
  });

  const {
    data: videosData,
    isLoading: videosLoading,
    isError: videosIsError,
    error: videosError,
  } = useListVideosQuery(chapterId, {
    skip: !chapterId,
  });

  const [createVideo, { isLoading: creatingVideo }] = useCreateVideoMutation();
  const [updateVideo, { isLoading: updatingVideo }] = useUpdateVideoMutation();
  const [deleteVideo, { isLoading: deletingVideo }] = useDeleteVideoMutation();

  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoForm, setVideoForm] = useState(initialVideoForm);
  const [editingVideoId, setEditingVideoId] = useState("");
  const [editingVideoForm, setEditingVideoForm] = useState(initialVideoForm);
  const [videoMessage, setVideoMessage] = useState("");
  const [videoError, setVideoError] = useState("");

  const chapter = chapterData?.data;
  const videos = videosData?.data || [];

  const previewVideoUrl = useMemo(() => {
    const id = videoForm.facebookVideoId.trim();
    if (!id) {
      return "";
    }
    return `https://www.facebook.com/watch/?v=${id}`;
  }, [videoForm.facebookVideoId]);

  const editPreviewVideoUrl = useMemo(() => {
    const id = editingVideoForm.facebookVideoId.trim();
    if (!id) {
      return "";
    }
    return `https://www.facebook.com/watch/?v=${id}`;
  }, [editingVideoForm.facebookVideoId]);

  const handleCreateVideo = async (event) => {
    event.preventDefault();
    setVideoMessage("");
    setVideoError("");

    if (!videoForm.title.trim() || !videoForm.facebookVideoId.trim()) {
      setVideoError("Video title and Facebook video ID are required.");
      return;
    }

    try {
      await createVideo({
        chapterId,
        title: videoForm.title.trim(),
        facebookVideoId: videoForm.facebookVideoId.trim(),
        description: videoForm.description.trim(),
      }).unwrap();

      setVideoMessage("Video added successfully.");
      setVideoForm(initialVideoForm);
      setShowVideoForm(false);
    } catch (createError) {
      setVideoError(createError?.data?.message || "Failed to add video.");
    }
  };

  const openEditVideo = (video) => {
    setEditingVideoId(video._id);
    setEditingVideoForm({
      title: video.title || "",
      facebookVideoId: video.facebookVideoId || "",
      description: video.description || "",
    });
    setVideoMessage("");
    setVideoError("");
  };

  const closeEditVideo = () => {
    setEditingVideoId("");
    setEditingVideoForm(initialVideoForm);
  };

  const handleUpdateVideo = async (event) => {
    event.preventDefault();
    setVideoMessage("");
    setVideoError("");

    if (!editingVideoId || !editingVideoForm.title.trim() || !editingVideoForm.facebookVideoId.trim()) {
      setVideoError("Video title and Facebook video ID are required.");
      return;
    }

    try {
      await updateVideo({
        videoId: editingVideoId,
        chapterId,
        title: editingVideoForm.title.trim(),
        facebookVideoId: editingVideoForm.facebookVideoId.trim(),
        description: editingVideoForm.description.trim(),
      }).unwrap();

      setVideoMessage("Video updated successfully.");
      closeEditVideo();
    } catch (updateError) {
      setVideoError(updateError?.data?.message || "Failed to update video.");
    }
  };

  const handleDeleteVideo = async (video) => {
    const confirmed = window.confirm(`Delete "${video.title}" permanently?`);
    if (!confirmed) {
      return;
    }

    setVideoMessage("");
    setVideoError("");

    try {
      await deleteVideo({
        videoId: video._id,
        chapterId,
      }).unwrap();

      setVideoMessage("Video deleted successfully.");
      if (editingVideoId === video._id) {
        closeEditVideo();
      }
    } catch (deleteError) {
      setVideoError(deleteError?.data?.message || "Failed to delete video.");
    }
  };

  if (chapterLoading) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <CardLoader label="Loading chapter..." />
        </section>
      </RequireAuth>
    );
  }

  if (!chapter || chapterIsError) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {chapterError?.data?.message || "Chapter not found or access denied."}
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
            href={chapter?.subject ? `/subjects/${chapter.subject}` : "/batches"}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
          >
            Back to Subject
          </Link>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Video Library
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {chapter.title}
              </p>
            </div>

            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setShowVideoForm((prev) => !prev);
                  setVideoMessage("");
                  setVideoError("");
                }}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-sky-700"
              >
                {showVideoForm ? "Close Form" : "Add Video"}
              </button>
            ) : null}
          </div>

          {videoMessage ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {videoMessage}
            </p>
          ) : null}
          {videoError ? (
            <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {videoError}
            </p>
          ) : null}

          {canManage && showVideoForm ? (
            <form
              onSubmit={handleCreateVideo}
              className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50 p-4"
            >
              <div className="grid gap-2">
                <input
                  required
                  value={videoForm.title}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Video title"
                  className={fieldClass()}
                />
                <input
                  required
                  value={videoForm.facebookVideoId}
                  onChange={(event) =>
                    setVideoForm((prev) => ({ ...prev, facebookVideoId: event.target.value }))
                  }
                  placeholder="Facebook video ID"
                  className={fieldClass()}
                />
                <textarea
                  value={videoForm.description}
                  onChange={(event) =>
                    setVideoForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Video description"
                  className={fieldClass()}
                  rows={3}
                />
              </div>

              {previewVideoUrl ? (
                <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                  Generated URL: {previewVideoUrl}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={creatingVideo}
                className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {creatingVideo ? "Adding..." : "Add Video"}
              </button>
            </form>
          ) : null}

          {videosLoading ? (
            <CardLoader label="Loading videos..." />
          ) : videosIsError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {videosError?.data?.message || "Unable to load videos."}
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No videos yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <article
                  key={video._id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-100/70 blur-2xl" />
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700">
                    <VideoIcon className="h-5 w-5" />
                  </span>

                  {editingVideoId === video._id && canManage ? (
                    <form onSubmit={handleUpdateVideo} className="space-y-2">
                      <input
                        required
                        value={editingVideoForm.title}
                        onChange={(event) =>
                          setEditingVideoForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                        placeholder="Video title"
                        className={fieldClass()}
                      />
                      <input
                        required
                        value={editingVideoForm.facebookVideoId}
                        onChange={(event) =>
                          setEditingVideoForm((prev) => ({
                            ...prev,
                            facebookVideoId: event.target.value,
                          }))
                        }
                        placeholder="Facebook video ID"
                        className={fieldClass()}
                      />
                      <textarea
                        value={editingVideoForm.description}
                        onChange={(event) =>
                          setEditingVideoForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Video description"
                        className={fieldClass()}
                        rows={3}
                      />

                      {editPreviewVideoUrl ? (
                        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                          Generated URL: {editPreviewVideoUrl}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={updatingVideo}
                          className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
                        >
                          {updatingVideo ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={closeEditVideo}
                          className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                        {video.title}
                      </h3>

                      {video.description ? (
                        <p className="mt-2 min-h-[40px] text-sm text-slate-600">{video.description}</p>
                      ) : null}

                      {video.facebookVideoId ? (
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          ID: {video.facebookVideoId}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {video.facebookVideoUrl || video.facebookVideoId ? (
                          <a
                            href={
                              video.facebookVideoUrl ||
                              `https://www.facebook.com/watch/?v=${video.facebookVideoId}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition group-hover:bg-slate-50"
                          >
                            Open Video
                          </a>
                        ) : null}

                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditVideo(video)}
                              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-cyan-700 transition hover:bg-cyan-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(video)}
                              disabled={deletingVideo}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </>
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
