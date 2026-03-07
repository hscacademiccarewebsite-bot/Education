"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/layouts/PageHero";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { InlineLoader, ListSkeleton } from "@/components/loaders/AppLoader";
import {
  useCreateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useGetAdminHeroSlidesQuery,
  useReorderHeroSlidesMutation,
  useUpdateHeroSlideMutation,
} from "@/lib/features/home/homeApi";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

const makeEmptyForm = (priority = 0) => ({
  priority,
  imageAsset: null,
});

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
}

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

function StatCard({ label, value, hint = "" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/70">{hint}</p> : null}
    </div>
  );
}

function formatUpdatedAt(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
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
  const [success, setSuccess] = useState("");

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
    setSuccess("");
  };

  const handleStartEdit = (slide) => {
    setEditingSlideId(slide.id);
    setForm(formFromSlide(slide));
    setImageTouched(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      priority: Math.max(0, Number(form.priority) || 0),
    };

    setError("");
    setSuccess("");

    try {
      if (editingSlideId) {
        if (imageTouched) {
          if (!form.imageAsset?.url) {
            setError("Slider image is required.");
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
        setSuccess("Slide updated successfully.");
      } else {
        if (!form.imageAsset?.url) {
          setError("Upload a slider image before creating.");
          return;
        }

        payload.image = {
          url: form.imageAsset.url,
          publicId: form.imageAsset.publicId || "",
        };

        await createHeroSlide(payload).unwrap();
        setSuccess("Slide created successfully.");
      }

      setEditingSlideId("");
      setImageTouched(false);
      setForm(makeEmptyForm(nextPriority));
    } catch (submitError) {
      setError(normalizeApiError(submitError));
    }
  };

  const handleDelete = async (slideId) => {
    const confirmed = window.confirm("Delete this slider image?");
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteHeroSlide(slideId).unwrap();
      if (editingSlideId === slideId) {
        setForm(makeEmptyForm(nextPriority));
        setEditingSlideId("");
        setImageTouched(false);
      }
      setSuccess("Slide deleted successfully.");
    } catch (deleteError) {
      setError(normalizeApiError(deleteError));
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
    setSuccess("");

    try {
      await reorderHeroSlides(orderedIds).unwrap();
      setSuccess("Slider order updated.");
    } catch (moveError) {
      setError(normalizeApiError(moveError));
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Homepage Experience"
          title="Slider Studio"
          description="Maintain homepage slider visuals with clean operational control. Only image and priority are supported."
          actions={
            <>
              <button type="button" onClick={() => refetch()} className="site-button-secondary">
                Refresh Data
              </button>
              <Link href="/dashboard/site-settings" className="site-button-secondary">
                Site Settings
              </Link>
              <Link href="/dashboard" className="site-button-primary">
                Back To Dashboard
              </Link>
            </>
          }
          aside={
            <div className="space-y-3">
              <StatCard label="Total Slides" value={slides.length} />
              <StatCard label="Next Priority" value={nextPriority} hint="Suggested for new slide" />
              <StatCard
                label="Queue Mode"
                value={reordering ? "LIVE" : "READY"}
                hint={reordering ? "Reordering in progress..." : "Manual controls available"}
              />
            </div>
          }
        />

        <div className="mt-6 space-y-4">
          {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
          {success ? <MessageBanner tone="success">{success}</MessageBanner> : null}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <article className="site-panel h-fit rounded-[34px] p-5 md:sticky md:top-24 md:p-6">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                {editingSlideId ? "Edit Mode" : "Create Mode"}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {editingSlideId
                  ? "Update priority or replace image for this slide."
                  : "Upload an image and set priority to insert a new slide."}
              </p>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, priority: Number(event.target.value) || 0 }))
                  }
                  className={fieldClass()}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Lower number appears first in homepage slider order.
                </p>
              </div>

              <ImageUploadField
                label="Slider Image Upload"
                folder="hsc-academic/sliders"
                asset={form.imageAsset}
                previewAlt="Slider image preview"
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
                      ? "Saving..."
                      : "Creating..."
                    : editingSlideId
                    ? "Save Slide"
                    : "Create Slide"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="site-button-secondary"
                >
                  {editingSlideId ? "Cancel Edit" : "Reset Form"}
                </button>
              </div>
            </form>
          </article>

          <article className="site-panel rounded-[34px] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Queue Manager
                </p>
                <h2 className="font-display mt-3 text-2xl font-black text-slate-950">
                  Current Slider Sequence
                </h2>
              </div>
              {reordering ? <InlineLoader label="Reordering slides..." /> : null}
            </div>

            {sliderLoading ? (
              <div className="mt-6">
                <ListSkeleton rows={4} />
              </div>
            ) : sliderError ? (
              <div className="mt-6">
                <MessageBanner tone="error">
                  Failed to load sliders.{" "}
                  <button type="button" onClick={() => refetch()} className="underline">
                    Retry
                  </button>
                </MessageBanner>
              </div>
            ) : slides.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-600">
                No slider images found. Create your first slide from the form.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="site-panel-muted grid gap-4 rounded-[28px] p-4 md:grid-cols-[240px_minmax(0,1fr)]"
                  >
                    <div className="relative overflow-hidden rounded-[20px] border border-slate-200">
                      <img
                        src={slide.imageUrl}
                        alt={`Slider ${index + 1}`}
                        className="h-44 w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                          Priority {slide.priority}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          Slide {String(index + 1).padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                          Slot {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
                          Priority {slide.priority}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                          Updated {formatUpdatedAt(slide.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleMove(slide.id, "up")}
                          disabled={reordering || index === 0}
                          className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(slide.id, "down")}
                          disabled={reordering || index === slides.length - 1}
                          className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(slide)}
                          className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(slide.id)}
                          disabled={deleting}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </RequireAuth>
  );
}
