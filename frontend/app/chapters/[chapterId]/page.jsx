"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import { ChapterIcon, VideoIcon } from "@/components/icons/PortalIcons";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
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
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const initialVideoForm = {
  title: "",
  facebookVideoId: "",
  description: "",
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

function toFacebookWatchUrl(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) {
    return "";
  }
  return `https://www.facebook.com/watch/?v=${cleanId}`;
}

function VideoDirectoryCard({ video, index, canManage, onEdit, onDelete, deletingVideo, t }) {
  return (
    <article className="group rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <VideoIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{t("chapterDetails.videoCard.reference", "Lecture Reference")}</p>
            <h3 className="mt-1 truncate text-base font-black text-slate-950 md:text-lg">{video.title}</h3>
          </div>
        </div>

        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">{t("chapterDetails.videoCard.node", "Video Node")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <ChapterIcon className="h-3.5 w-3.5" />
          Chapter Layer
        </span>
        {video.facebookVideoId ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">{t("chapterDetails.videoCard.linkReady", "Link Ready")}</span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {video.description || t("chapterDetails.videoCard.noDesc", "No description provided for this lecture reference.")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(video.facebookVideoUrl || video.facebookVideoId) && (
          <a
            href={video.facebookVideoUrl || toFacebookWatchUrl(video.facebookVideoId)}
            target="_blank"
            rel="noreferrer"
            className="site-button-primary px-4 py-2 text-xs"
          >{t("chapterDetails.actions.openVideo", "Open Video")}</a>
        )}
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(video)}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
            >{t("chapterDetails.actions.edit", "Edit")}</button>
            <button
              type="button"
              onClick={() => onDelete(video)}
              disabled={deletingVideo}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
            >{t("chapterDetails.actions.delete", "Delete")}</button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function ChapterDetailsPage() {
  const { chapterId } = useParams();
  const { t } = useSiteLanguage();
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
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();

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
      const validationMessage = t("chapterDetails.messages.videoReq", "Video title and Facebook video ID are required.");
      setVideoError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await createVideo({
        chapterId,
        title: videoForm.title.trim(),
        facebookVideoId: videoForm.facebookVideoId.trim(),
        description: videoForm.description.trim(),
      }).unwrap();

      setVideoMessage(t("chapterDetails.messages.addedSuccess", "Video added successfully."));
      showSuccess(t("chapterDetails.messages.addedSuccess", "Video added successfully."));
      setVideoForm(initialVideoForm);
      setShowVideoForm(false);
    } catch (createError) {
      const resolvedError = normalizeApiError(createError, "Failed to add video.");
      setVideoError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleUpdateVideo = async (event) => {
    event.preventDefault();
    setVideoMessage("");
    setVideoError("");

    if (!editingVideoId || !editingVideoForm.title.trim() || !editingVideoForm.facebookVideoId.trim()) {
      const validationMessage = t("chapterDetails.messages.videoReq", "Video title and Facebook video ID are required.");
      setVideoError(validationMessage);
      showError(validationMessage);
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

      setVideoMessage(t("chapterDetails.messages.updatedSuccess", "Video updated successfully."));
      showSuccess(t("chapterDetails.messages.updatedSuccess", "Video updated successfully."));
      closeManagementPanel();
    } catch (updateError) {
      const resolvedError = normalizeApiError(updateError, "Failed to update video.");
      setVideoError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleDeleteVideo = async (video) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("chapterDetails.messages.deleteConfirmTitle", `Delete "${video.title}"?`, { title: video.title }),
      message: t("chapterDetails.messages.deleteConfirmMsg", "This lecture reference will be removed permanently. Type DELETE to continue."),
      approveLabel: t("chapterDetails.messages.deleteBtn", "Delete Video"),
    });
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

      setVideoMessage(t("chapterDetails.messages.deletedSuccess", "Video deleted successfully."));
      showSuccess(t("chapterDetails.messages.deletedSuccess", "Video deleted successfully."));
      if (editingVideoId === video._id) {
        closeManagementPanel();
      }
    } catch (deleteError) {
      const resolvedError = normalizeApiError(deleteError, "Failed to delete video.");
      setVideoError(resolvedError);
      showError(resolvedError);
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
            {chapterError?.data?.message || t("chapterDetails.messages.notFound", "Chapter not found or access denied.")}
          </MessageBanner>
        </section>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <div className="space-y-4">
          <p className="site-kicker">{t("chapterDetails.layout.chapter", "Chapter")}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[42px]">
            {chapter.title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{t("chapterDetails.layout.desc", "Manage lecture references and keep delivery simple.")}</p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={chapter?.subject ? `/subjects/${chapter.subject}` : "/courses"}
              className="site-button-secondary"
            >{t("chapterDetails.actions.backToSubject", "Back To Subject")}</Link>
            {canManage ? (
              <button type="button" onClick={openCreatePanel} className="site-button-primary">
                {showVideoForm && !editingVideoId ? t("chapterDetails.actions.closePopup", "Close Popup") : t("chapterDetails.actions.addVideo", "Add Video")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {videosIsError ? (
            <MessageBanner tone="warning">
              {videosError?.data?.message || t("chapterDetails.messages.loadError", "Unable to load videos.")}
            </MessageBanner>
          ) : null}
        </div>

        <div className="mt-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="site-kicker">{t("chapterDetails.layout.videoDirectory", "Video Directory")}</p>
                <h2 className="font-display mt-4 text-3xl font-black text-slate-950">{t("chapterDetails.layout.lectureMap", "Lecture map")}</h2>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {videos.length} {t("chapterDetails.layout.total", "total")}</p>
            </div>

            {videosLoading ? (
              <div className="site-panel rounded-[clamp(8px,5%,12px)] p-5">
                <ListSkeleton rows={3} />
              </div>
            ) : videos.length === 0 ? (
              <div className="site-panel rounded-[clamp(8px,5%,12px)] px-5 py-12 text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <VideoIcon className="h-6 w-6" />
                </span>
                <p className="font-display mt-4 text-2xl font-black text-slate-950">{t("chapterDetails.layout.noVideos", "No videos yet")}</p>
                <p className="mt-3 text-sm text-slate-600">{t("chapterDetails.layout.addFirstVideo", "Add the first lecture reference to activate this chapter.")}</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {videos.map((video, index) => (
                  <VideoDirectoryCard
                    key={video._id}
                    video={video}
                    index={index}
                    canManage={canManage}
                    onEdit={openEditVideo}
                    onDelete={handleDeleteVideo}
                    deletingVideo={deletingVideo}
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
              className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="site-kicker">{editingVideoId ? t("chapterDetails.layout.updateVideo", "Update Video") : t("chapterDetails.actions.addVideo", "Add Video")}</p>
                  <h2 className="font-display mt-4 text-2xl font-black text-slate-950 md:text-3xl">
                    {editingVideoId ? t("chapterDetails.layout.editMetadata", "Edit lecture metadata") : t("chapterDetails.layout.registerNew", "Register lecture reference")}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{t("chapterDetails.layout.keepLinkValid", "Use the exact Facebook video ID so the generated watch link stays valid for students.")}</p>
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
                onSubmit={editingVideoId ? handleUpdateVideo : handleCreateVideo}
                className="mt-6 space-y-4"
              >
                <FloatingInput
                  required
                  label={t("chapterDetails.layout.videoTitle", "Video Title")}
                  value={editingVideoId ? editingVideoForm.title : videoForm.title}
                  onChange={(event) =>
                    editingVideoId
                      ? setEditingVideoForm((prev) => ({ ...prev, title: event.target.value }))
                      : setVideoForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  hint={t("chapterDetails.layout.videoHint", "e.g., Vector Class 01")}
                />

                <FloatingInput
                  required
                  label={t("chapterDetails.layout.fbVideoId", "Facebook Video ID")}
                  value={editingVideoId ? editingVideoForm.facebookVideoId : videoForm.facebookVideoId}
                  onChange={(event) =>
                    editingVideoId
                      ? setEditingVideoForm((prev) => ({
                          ...prev,
                          facebookVideoId: event.target.value,
                        }))
                      : setVideoForm((prev) => ({ ...prev, facebookVideoId: event.target.value }))
                  }
                  hint={t("chapterDetails.layout.fbVideoHint", "e.g., 123456789012345")}
                />

                <FloatingTextarea
                  label={t("chapterDetails.layout.description", "Description")}
                  value={editingVideoId ? editingVideoForm.description : videoForm.description}
                  onChange={(event) =>
                    editingVideoId
                      ? setEditingVideoForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      : setVideoForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={4}
                  hint={t("chapterDetails.layout.descHint", "Optional lecture note")}
                />

                {(editingVideoId ? editPreviewVideoUrl : previewVideoUrl) ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">{t("chapterDetails.layout.generatedUrl", "Generated Facebook URL")}</p>
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
                        ? t("chapterDetails.actions.saving", "Saving...")
                        : t("chapterDetails.actions.saveVideo", "Save Video")
                      : creatingVideo
                      ? t("chapterDetails.actions.adding", "Adding...")
                      : t("chapterDetails.actions.addVideo", "Add Video")}
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
