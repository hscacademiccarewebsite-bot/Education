"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import PageHero from "@/components/layouts/PageHero";
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
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

const initialVideoForm = {
  title: "",
  facebookVideoId: "",
  description: "",
};

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100";
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

function toFacebookWatchUrl(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) {
    return "";
  }
  return `https://www.facebook.com/watch/?v=${cleanId}`;
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
  const managementOpen = canManage && (showVideoForm || Boolean(editingVideoId));

  const previewVideoUrl = useMemo(() => toFacebookWatchUrl(videoForm.facebookVideoId), [videoForm.facebookVideoId]);
  const editPreviewVideoUrl = useMemo(
    () => toFacebookWatchUrl(editingVideoForm.facebookVideoId),
    [editingVideoForm.facebookVideoId]
  );

  const openCreatePanel = () => {
    setEditingVideoId("");
    setEditingVideoForm(initialVideoForm);
    setVideoForm(initialVideoForm);
    setShowVideoForm((prev) => !prev || Boolean(editingVideoId));
    setVideoMessage("");
    setVideoError("");
  };

  const openEditVideo = (video) => {
    setEditingVideoId(video._id);
    setEditingVideoForm({
      title: video.title || "",
      facebookVideoId: video.facebookVideoId || "",
      description: video.description || "",
    });
    setShowVideoForm(false);
    setVideoMessage("");
    setVideoError("");
  };

  const closeManagementPanel = () => {
    setShowVideoForm(false);
    setEditingVideoId("");
    setEditingVideoForm(initialVideoForm);
  };

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
      setVideoError(normalizeApiError(createError, "Failed to add video."));
    }
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
      closeManagementPanel();
    } catch (updateError) {
      setVideoError(normalizeApiError(updateError, "Failed to update video."));
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
        closeManagementPanel();
      }
    } catch (deleteError) {
      setVideoError(normalizeApiError(deleteError, "Failed to delete video."));
    }
  };

  if (chapterLoading) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <CardSkeleton />
        </section>
      </RequireAuth>
    );
  }

  if (!chapter || chapterIsError) {
    return (
      <RequireAuth>
        <section className="container-page py-10">
          <MessageBanner tone="error">
            {chapterError?.data?.message || "Chapter not found or access denied."}
          </MessageBanner>
        </section>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Video Operations"
          title={chapter.title}
          description="Manage lecture references with enterprise-grade indexing, metadata control, and quick access links."
          actions={
            <>
              <Link
                href={chapter?.subject ? `/subjects/${chapter.subject}` : "/courses"}
                className="site-button-secondary"
              >
                Back To Subject
              </Link>
              {canManage ? (
                <button type="button" onClick={openCreatePanel} className="site-button-primary">
                  {showVideoForm && !editingVideoId ? "Close Panel" : "Add Video"}
                </button>
              ) : null}
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Videos</p>
                <p className="mt-2 text-3xl font-black text-white">{videos.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Content Layer</p>
                <p className="mt-2 text-sm font-semibold text-white">Lecture delivery</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Source Type</p>
                <p className="mt-2 text-sm font-semibold text-white">Facebook Watch IDs</p>
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
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Chapter</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700">Video</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {videoMessage ? <MessageBanner tone="success">{videoMessage}</MessageBanner> : null}
          {videoError ? <MessageBanner tone="error">{videoError}</MessageBanner> : null}
          {videosIsError ? (
            <MessageBanner tone="warning">
              {videosError?.data?.message || "Unable to load videos."}
            </MessageBanner>
          ) : null}
        </div>

        <div className={`mt-8 grid gap-6 ${managementOpen ? "xl:grid-cols-[minmax(0,1fr)_410px]" : ""}`}>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="site-kicker">Video Directory</p>
                <h2 className="font-display mt-4 text-3xl font-black text-slate-950">Lecture register</h2>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Enterprise media indexing
              </p>
            </div>

            <div className="site-panel overflow-hidden rounded-[30px]">
              <div className="hidden border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 md:grid md:grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:gap-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">No</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Lecture</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Video ID / Notes</p>
                <p className="text-right text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Actions</p>
              </div>

              {videosLoading ? (
                <div className="p-5">
                  <ListSkeleton rows={3} />
                </div>
              ) : videos.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <VideoIcon className="h-6 w-6" />
                  </span>
                  <p className="font-display mt-4 text-2xl font-black text-slate-950">No videos yet</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Add the first lecture reference to activate this chapter.
                  </p>
                </div>
              ) : (
                videos.map((video, index) => (
                  <article
                    key={video._id}
                    className="border-b border-slate-200/70 px-4 py-4 last:border-b-0 md:px-5"
                  >
                    <div className="grid gap-3 md:grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center md:gap-4">
                      <div className="flex items-center gap-3 md:gap-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 md:ml-2">
                          <VideoIcon className="h-5 w-5" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Lecture</p>
                        <h3 className="mt-1 truncate text-lg font-black text-slate-950">{video.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">ID: {video._id}</p>
                      </div>

                      <div className="space-y-1.5">
                        {video.facebookVideoId ? (
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                            FB ID: <span className="font-semibold normal-case tracking-normal text-slate-700">{video.facebookVideoId}</span>
                          </p>
                        ) : null}
                        <p className="text-sm leading-6 text-slate-600">
                          {video.description || "No description provided for this lecture reference."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {(video.facebookVideoUrl || video.facebookVideoId) && (
                          <a
                            href={video.facebookVideoUrl || toFacebookWatchUrl(video.facebookVideoId)}
                            target="_blank"
                            rel="noreferrer"
                            className="site-button-primary px-4 py-2 text-xs"
                          >
                            Open Video
                          </a>
                        )}
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditVideo(video)}
                              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(video)}
                              disabled={deletingVideo}
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
              <p className="site-kicker">{editingVideoId ? "Update Video" : "Add Video"}</p>
              <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                {editingVideoId ? "Edit lecture metadata" : "Register lecture reference"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use the exact Facebook video ID so the generated watch link stays valid for students.
              </p>

              <form
                onSubmit={editingVideoId ? handleUpdateVideo : handleCreateVideo}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Video Title
                  </label>
                  <input
                    required
                    value={editingVideoId ? editingVideoForm.title : videoForm.title}
                    onChange={(event) =>
                      editingVideoId
                        ? setEditingVideoForm((prev) => ({ ...prev, title: event.target.value }))
                        : setVideoForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Vector Class 01"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Facebook Video ID
                  </label>
                  <input
                    required
                    value={editingVideoId ? editingVideoForm.facebookVideoId : videoForm.facebookVideoId}
                    onChange={(event) =>
                      editingVideoId
                        ? setEditingVideoForm((prev) => ({
                            ...prev,
                            facebookVideoId: event.target.value,
                          }))
                        : setVideoForm((prev) => ({ ...prev, facebookVideoId: event.target.value }))
                    }
                    placeholder="123456789012345"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={editingVideoId ? editingVideoForm.description : videoForm.description}
                    onChange={(event) =>
                      editingVideoId
                        ? setEditingVideoForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        : setVideoForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Optional lecture note"
                    rows={4}
                    className={fieldClass()}
                  />
                </div>

                {(editingVideoId ? editPreviewVideoUrl : previewVideoUrl) ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                      Generated Facebook URL
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-sky-700">
                      {editingVideoId ? editPreviewVideoUrl : previewVideoUrl}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={creatingVideo || updatingVideo}
                    className="site-button-primary"
                  >
                    {editingVideoId
                      ? updatingVideo
                        ? "Saving..."
                        : "Save Video"
                      : creatingVideo
                      ? "Adding..."
                      : "Add Video"}
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
