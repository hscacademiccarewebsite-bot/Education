"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
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
    <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${classes}`}>
      {children}
    </div>
  );
}

function StatTile({ label, value, hint = "" }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">{hint}</p> : null}
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
  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    data: sliderData,
    isLoading: sliderLoading,
    isError: sliderError,
    refetch,
  } = useGetAdminHeroSlidesQuery(undefined, {
    skip: !isInitialized || !isAuthenticated,
  });

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
      <section className="container-page py-6 md:py-8">
        <header className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8fafc] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Homepage Experience</p>
              <h1 className="mt-1 text-xl md:text-2xl font-black text-slate-900 drop-shadow-sm [font-family:'Trebuchet_MS','Avenir_Next','Segoe_UI',sans-serif]">
                <span className="text-emerald-600">Slider</span> Control Center
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                type="button" 
                onClick={() => refetch()} 
                className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              >
                {t("sliderControlPage.refresh")}
              </button>
              <Link 
                href="/dashboard/site-settings" 
                className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              >
                {t("siteSettingsPage.title")}
              </Link>
              <Link 
                href="/dashboard" 
                className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
              >
                {t("navbar.dashboard")}
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-4">
          {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
        </div>

        <div className="mt-4 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <article className="site-panel h-fit rounded-xl p-4 xl:sticky xl:top-20">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  {editingSlideId ? t("sliderControlPage.editSlide") : t("sliderControlPage.createSlide")}
                </h2>
              </div>
              {editingSlideId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="site-button-secondary h-7 text-[10px] px-2.5 py-0 disabled:opacity-60"
                >
                  {t("sliderControlPage.cancel")}
                </button>
              ) : null}
            </div>

            {editingSlide ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                  {t("sliderControlPage.currentlyEditing")}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
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

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" disabled={submitting} className="site-button-primary h-8 text-xs py-0">
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
                  className="site-button-secondary h-8 text-xs py-0"
                >
                  {t("sliderControlPage.reset")}
                </button>
              </div>
            </form>
          </article>

          <article className="site-panel rounded-xl p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  {t("sliderControlPage.currentSequence")} <span className="text-slate-500">({slides.length})</span>
                </h2>
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
                <p className="mt-4 text-lg font-extrabold text-slate-900">{t("sliderControlPage.noSlidesTitle")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {t("sliderControlPage.noSlidesSubtitle")}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {slides.map((slide, index) => (
                  <article
                    key={slide.id}
                    className={`rounded-lg border p-2 transition ${
                      editingSlideId === slide.id
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white h-24 w-36 md:h-28 md:w-48 shadow-sm">
                        <img
                          src={slide.imageUrl}
                          alt={`${t("sliderControlPage.slideWord")} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                           <span className="text-[10px] font-extrabold text-white">#{index + 1}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600">
                            P{slide.priority}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatUpdatedAt(slide.updatedAt, language)}
                          </span>
                          {editingSlideId === slide.id ? (
                            <span className="rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                              {t("sliderControlPage.editing")}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleMove(slide.id, "up")}
                              disabled={reordering || index === 0}
                              className="inline-flex h-8 w-8 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:opacity-30"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>
                            <span className="w-px bg-slate-100" />
                            <button
                              type="button"
                              onClick={() => handleMove(slide.id, "down")}
                              disabled={reordering || index === slides.length - 1}
                              className="inline-flex h-8 w-8 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:opacity-30"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(slide)}
                            className="inline-flex h-8 items-center justify-center rounded-full border border-[#0d9488]/20 bg-[#f0fdfa] px-5 text-[11px] font-black uppercase tracking-wider text-[#0f766e] transition hover:bg-[#ccfbf1]"
                          >
                            {t("sliderControlPage.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slide.id)}
                            disabled={deleting}
                            className="inline-flex h-8 items-center justify-center rounded-full border border-rose-200 bg-[#fff1f2] px-4 text-[11px] font-black uppercase tracking-wider text-[#e11d48] transition hover:bg-[#ffe4e6] disabled:opacity-50"
                          >
                            DEL
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
