"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { InlineLoader, ListSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput } from "@/components/forms/FloatingField";
import {
  useCreateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useGetAdminHeroSlidesQuery,
  useReorderHeroSlidesMutation,
  useUpdateHeroSlideMutation,
} from "@/lib/features/home/homeApi";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const makeEmptyForm = (priority = 0) => ({
  priority,
  imageAsset: null,
});

function formFromSlide(slide) {
  return {
    priority: Number(slide?.priority || 0),
    imageAsset: slide?.imageUrl
      ? {
          url: slide.imageUrl,
          publicId: slide?.image?.publicId || "",
        }
      : null,
  };
}

function MessageBanner({ tone, children }) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>
      {children}
    </div>
  );
}

function StatTile({ label, value, hint = "" }) {
  return (
    <article className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function formatUpdatedAt(value, language = "en") {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SliderControlPage() {
  const {
    data: sliderData,
    isLoading: sliderLoading,
    isError: sliderError,
    refetch,
  } = useGetAdminHeroSlidesQuery();

  const [createHeroSlide, { isLoading: creating }] = useCreateHeroSlideMutation();
  const [updateHeroSlide, { isLoading: updating }] = useUpdateHeroSlideMutation();
  const [deleteHeroSlide, { isLoading: deleting }] = useDeleteHeroSlideMutation();
  const [reorderHeroSlides, { isLoading: reordering }] = useReorderHeroSlidesMutation();

  const slides = sliderData?.data || [];
  const [editingSlideId, setEditingSlideId] = useState("");
  const [form, setForm] = useState(() => makeEmptyForm(0));
  const [imageTouched, setImageTouched] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();
  const { t, language } = useSiteLanguage();

  const submitting = creating || updating;
  const editingSlide = useMemo(
    () => slides.find((slide) => slide.id === editingSlideId) || null,
    [slides, editingSlideId]
  );

  const maxPriority = useMemo(
    () => slides.reduce((max, slide) => Math.max(max, Number(slide.priority) || 0), 0),
    [slides]
  );

  const nextPriority = maxPriority + 1;

  useEffect(() => {
    if (!editingSlideId && slides.length > 0 && form.priority === 0 && !form.imageAsset?.url) {
      setForm(makeEmptyForm(nextPriority));
    }
  }, [editingSlideId, form.imageAsset?.url, form.priority, nextPriority, slides.length]);

  const resetForm = () => {
    setForm(makeEmptyForm(nextPriority));
    setEditingSlideId("");
    setImageTouched(false);
    setError("");
  };

  const handleStartEdit = (slide) => {
    setEditingSlideId(slide.id);
    setForm(formFromSlide(slide));
    setImageTouched(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      priority: Math.max(0, Number(form.priority) || 0),
    };

    setError("");

    try {
      if (editingSlideId) {
        if (imageTouched) {
          if (!form.imageAsset?.url) {
            const validationMessage = t("sliderControlPage.messages.sliderImageRequired");
            setError(validationMessage);
            showError(validationMessage);
            return;
          }
          payload.image = {
            url: form.imageAsset.url,
            publicId: form.imageAsset.publicId || "",
          };
        }

        await updateHeroSlide({
          slideId: editingSlideId,
          ...payload,
        }).unwrap();
        showSuccess(t("sliderControlPage.messages.slideUpdated"));
      } else {
        if (!form.imageAsset?.url) {
          const validationMessage = t("sliderControlPage.messages.uploadBeforeCreate");
          setError(validationMessage);
          showError(validationMessage);
          return;
        }

        payload.image = {
          url: form.imageAsset.url,
          publicId: form.imageAsset.publicId || "",
        };

        await createHeroSlide(payload).unwrap();
        showSuccess(t("sliderControlPage.messages.slideCreated"));
      }

      setEditingSlideId("");
      setImageTouched(false);
      setForm(makeEmptyForm(nextPriority));
    } catch (submitError) {
      const resolvedError = normalizeApiError(submitError);
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleDelete = async (slideId) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("sliderControlPage.deleteConfirmTitle"),
      message: t("sliderControlPage.deleteConfirmMessage"),
      approveLabel: t("sliderControlPage.deleteSlide"),
    });
    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteHeroSlide(slideId).unwrap();
      if (editingSlideId === slideId) {
        setForm(makeEmptyForm(nextPriority));
        setEditingSlideId("");
        setImageTouched(false);
      }
      showSuccess(t("sliderControlPage.messages.slideDeleted"));
    } catch (deleteError) {
      const resolvedError = normalizeApiError(deleteError);
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleMove = async (slideId, direction) => {
    const currentIndex = slides.findIndex((slide) => slide.id === slideId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) {
      return;
    }

    const orderedIds = slides.map((slide) => slide.id);
    [orderedIds[currentIndex], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[currentIndex],
    ];

    setError("");

    try {
      await reorderHeroSlides(orderedIds).unwrap();
      showSuccess(t("sliderControlPage.messages.orderUpdated"));
    } catch (moveError) {
      const resolvedError = normalizeApiError(moveError);
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <section className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="site-kicker">{t("sliderControlPage.kicker")}</p>
              <h1 className="site-title mt-4">{t("sliderControlPage.title")}</h1>
              <p className="site-lead mt-4 max-w-3xl">
                {t("sliderControlPage.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => refetch()} className="site-button-secondary">
                {t("sliderControlPage.refresh")}
              </button>
              <Link href="/dashboard/site-settings" className="site-button-secondary">
                {t("siteSettingsPage.title")}
              </Link>
              <Link href="/dashboard" className="site-button-primary">
                {t("navbar.dashboard")}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatTile label={t("sliderControlPage.stats.totalSlides")} value={slides.length} />
            <StatTile label={t("sliderControlPage.stats.nextPriority")} value={nextPriority} hint={t("sliderControlPage.stats.suggestedForNew")} />
            <StatTile
              label={t("sliderControlPage.stats.queueState")}
              value={reordering ? t("sliderControlPage.updating") : t("sliderControlPage.ready")}
              hint={reordering ? t("sliderControlPage.reorderingProgress") : t("sliderControlPage.manualControlsAvailable")}
            />
            <StatTile
              label={t("sliderControlPage.stats.editing")}
              value={editingSlide ? t("usersPage.active") : t("sliderControlPage.none")}
              hint={editingSlide ? `${t("sliderControlPage.slideWord")} ${String(slides.findIndex((s) => s.id === editingSlideId) + 1).padStart(2, "0")}` : t("sliderControlPage.createModeEnabled")}
            />
          </div>
        </section>

        <div className="mt-6 space-y-4">
          {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <article className="site-panel h-fit rounded-[clamp(8px,5%,12px)] p-5 md:p-6 xl:sticky xl:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {editingSlideId ? t("sliderControlPage.editSlide") : t("sliderControlPage.createSlide")}
                </p>
                <h2 className="font-display mt-2 text-2xl font-black text-slate-950">
                  {t("sliderControlPage.slideComposer")}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {editingSlideId
                    ? t("sliderControlPage.editHelp")
                    : t("sliderControlPage.createHelp")}
                </p>
              </div>
              {editingSlideId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="site-button-secondary disabled:opacity-60"
                >
                  {t("sliderControlPage.cancel")}
                </button>
              ) : null}
            </div>

            {editingSlide ? (
              <div className="mt-4 rounded-[clamp(8px,5%,12px)] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  {t("sliderControlPage.currentlyEditing")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {t("sliderControlPage.priority")} {editingSlide.priority} | {t("sliderControlPage.updated")} {formatUpdatedAt(editingSlide.updatedAt, language)}
                </p>
              </div>
            ) : null}

            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <FloatingInput
                type="number"
                min="0"
                label={t("sliderControlPage.priority")}
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: Number(event.target.value) || 0 }))
                }
                hint={t("sliderControlPage.priorityHint")}
              />

              <ImageUploadField
                label={t("sliderControlPage.sliderImageUpload")}
                folder="hsc-academic/sliders"
                asset={form.imageAsset}
                previewAlt={t("sliderControlPage.sliderPreviewAlt")}
                className="border-slate-200 bg-white"
                onChange={(asset) => {
                  setForm((prev) => ({
                    ...prev,
                    imageAsset: asset?.url
                      ? { url: asset.url, publicId: asset.publicId || "" }
                      : null,
                  }));
                  setImageTouched(true);
                }}
              />

              <div className="flex flex-wrap gap-3 pt-1">
                <button type="submit" disabled={submitting} className="site-button-primary">
                  {submitting
                    ? editingSlideId
                      ? t("siteSettingsPage.saving")
                      : t("sliderControlPage.creating")
                    : editingSlideId
                    ? t("sliderControlPage.saveSlide")
                    : t("sliderControlPage.createSlide")}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="site-button-secondary"
                >
                  {t("sliderControlPage.reset")}
                </button>
              </div>
            </form>
          </article>

          <article className="site-panel rounded-[clamp(8px,5%,12px)] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("sliderControlPage.queueManager")}
                </p>
                <h2 className="font-display mt-3 text-2xl font-black text-slate-950">
                  {t("sliderControlPage.currentSequence")} ({slides.length})
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {t("sliderControlPage.sequenceHelp")}
                </p>
              </div>
              {reordering ? <InlineLoader label={t("sliderControlPage.reorderingSlides")} /> : null}
            </div>

            {sliderLoading ? (
              <div className="mt-6">
                <ListSkeleton rows={4} />
              </div>
            ) : sliderError ? (
              <div className="mt-6">
                <MessageBanner tone="error">
                  {t("sliderControlPage.loadError")}{" "}
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="font-semibold text-[var(--action-soft-text)] underline transition hover:text-[var(--action-start)]"
                  >
                    {t("sliderControlPage.retry")}
                  </button>
                </MessageBanner>
              </div>
            ) : slides.length === 0 ? (
              <div className="mt-6 rounded-[clamp(8px,5%,12px)] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5Zm3.75-6.75h.008v.008H7.75V9.75Zm0 0 4.5 4.5 2.25-2.25 3.75 3.75" />
                  </svg>
                </span>
                <p className="mt-4 text-lg font-black text-slate-900">{t("sliderControlPage.noSlidesTitle")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {t("sliderControlPage.noSlidesSubtitle")}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {slides.map((slide, index) => (
                  <article
                    key={slide.id}
                    className={`rounded-[clamp(8px,5%,12px)] border p-3 transition md:p-4 ${
                      editingSlideId === slide.id
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                    }`}
                  >
                    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white">
                        <img
                          src={slide.imageUrl}
                          alt={`${t("sliderControlPage.slideWord")} ${index + 1}`}
                          className="h-36 w-full object-cover md:h-32"
                        />
                        <div className="absolute left-2 top-2 rounded-full bg-slate-950/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                          {t("sliderControlPage.slot")} {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
                            {t("sliderControlPage.priority")} {slide.priority}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
                            {t("sliderControlPage.priority")} {slide.priority}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                            {t("sliderControlPage.updated")} {formatUpdatedAt(slide.updatedAt, language)}
                          </span>
                          {editingSlideId === slide.id ? (
                            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                              {t("sliderControlPage.editing")}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <div className="inline-flex overflow-hidden rounded-full border border-slate-300 bg-white">
                            <button
                              type="button"
                              onClick={() => handleMove(slide.id, "up")}
                              disabled={reordering || index === 0}
                              className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                              aria-label={t("sliderControlPage.moveUp")}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 14.25 4.5-4.5 4.5 4.5" />
                              </svg>
                            </button>
                            <span className="w-px bg-slate-200" />
                            <button
                              type="button"
                              onClick={() => handleMove(slide.id, "down")}
                              disabled={reordering || index === slides.length - 1}
                              className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                              aria-label={t("sliderControlPage.moveDown")}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 9.75-4.5 4.5-4.5-4.5" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(slide)}
                            className="site-button-secondary"
                          >
                            {t("sliderControlPage.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slide.id)}
                            disabled={deleting}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("sliderControlPage.delete")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
      {popupNode}
    </RequireAuth>
  );
}
