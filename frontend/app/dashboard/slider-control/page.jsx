"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { ListSkeleton, InlineLoader } from "@/components/loaders/AppLoader";
import {
  useCreateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useGetAdminHeroSlidesQuery,
  useReorderHeroSlidesMutation,
  useUpdateHeroSlideMutation,
} from "@/lib/features/home/homeApi";

const EMPTY_FORM = {
  title: "",
  caption: "",
  priority: 0,
  isActive: true,
  buttonEnabled: true,
  buttonText: "Explore Courses",
  buttonHref: "/courses",
  imageAsset: null,
};

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
}

function parseErrorMessage(error) {
  if (!error) {
    return "Request failed.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error?.data?.message) {
    return error.data.message;
  }
  if (error?.error) {
    return error.error;
  }
  if (error?.message) {
    return error.message;
  }
  return "Request failed.";
}

function formFromSlide(slide) {
  return {
    title: slide?.title || "",
    caption: slide?.caption || "",
    priority: Number(slide?.priority || 0),
    isActive: slide?.isActive !== false,
    buttonEnabled: slide?.buttonEnabled !== false,
    buttonText: slide?.buttonText || "Explore Courses",
    buttonHref: slide?.buttonHref || "/courses",
    imageAsset: slide?.imageUrl
      ? {
          url: slide.imageUrl,
          publicId: slide?.image?.publicId || "",
        }
      : null,
  };
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageTouched, setImageTouched] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitting = creating || updating;

  const editingSlide = useMemo(
    () => slides.find((slide) => slide.id === editingSlideId) || null,
    [slides, editingSlideId]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
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
      title: form.title.trim(),
      caption: form.caption.trim(),
      priority: Number(form.priority) || 0,
      isActive: Boolean(form.isActive),
      buttonEnabled: Boolean(form.buttonEnabled),
    };

    if (!payload.title) {
      setError("Slider title is required.");
      return;
    }

    if (payload.buttonEnabled) {
      payload.buttonText = form.buttonText.trim() || "Explore Courses";
      payload.buttonHref = form.buttonHref.trim() || "/courses";
    } else {
      payload.buttonText = "";
      payload.buttonHref = "";
    }

    setError("");
    setSuccess("");

    try {
      if (editingSlideId) {
        if (imageTouched) {
          if (form.imageAsset?.url) {
            payload.image = {
              url: form.imageAsset.url,
              publicId: form.imageAsset.publicId || "",
            };
          } else if (editingSlide?.imageUrl) {
            payload.removeImage = true;
          }
        }

        await updateHeroSlide({
          slideId: editingSlideId,
          ...payload,
        }).unwrap();
        setSuccess("Slider updated successfully.");
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
        setSuccess("Slider created successfully.");
      }

      setEditingSlideId("");
      setImageTouched(false);
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(parseErrorMessage(submitError));
    }
  };

  const handleDelete = async (slideId) => {
    const confirmed = window.confirm("Delete this slider?");
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await deleteHeroSlide(slideId).unwrap();
      if (editingSlideId === slideId) {
        resetForm();
      }
      setSuccess("Slider deleted successfully.");
    } catch (deleteError) {
      setError(parseErrorMessage(deleteError));
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
      setSuccess("Slider priority updated.");
    } catch (moveError) {
      setError(parseErrorMessage(moveError));
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                Admin Panel
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Homepage Slider Control
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage hero slides with image, title, caption, dynamic button settings, and priority
                order.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900">
                  {editingSlideId ? "Edit Slider" : "Create Slider"}
                </h2>
                {editingSlideId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Title
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Slider title"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Caption
                  </label>
                  <textarea
                    value={form.caption}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, caption: event.target.value }))
                    }
                    placeholder="Slider caption text"
                    className={fieldClass()}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                  </div>
                  <label className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    Active
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.buttonEnabled}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, buttonEnabled: event.target.checked }))
                    }
                  />
                  Button Needed
                </label>

                {form.buttonEnabled ? (
                  <div className="grid gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Button Text
                      </label>
                      <input
                        value={form.buttonText}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, buttonText: event.target.value }))
                        }
                        placeholder="Explore Courses"
                        className={fieldClass()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Button Link
                      </label>
                      <input
                        value={form.buttonHref}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, buttonHref: event.target.value }))
                        }
                        placeholder="/courses"
                        className={fieldClass()}
                      />
                    </div>
                  </div>
                ) : null}

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

                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    {success}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400"
                  >
                    {submitting
                      ? editingSlideId
                        ? "Saving..."
                        : "Creating..."
                      : editingSlideId
                      ? "Save Slider"
                      : "Create Slider"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900">Slider List</h2>
                {reordering ? <InlineLoader label="Updating priority..." /> : null}
              </div>

              {sliderLoading ? (
                <ListSkeleton rows={4} />
              ) : sliderError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                  Failed to load sliders.
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : slides.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                  No slider created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[150px_minmax(0,1fr)]"
                    >
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="h-28 w-full rounded-xl object-cover md:h-full"
                      />

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700">
                            Priority {slide.priority}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              slide.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {slide.isActive ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              slide.buttonEnabled
                                ? "bg-cyan-100 text-cyan-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {slide.buttonEnabled ? "Button On" : "Button Off"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-black text-slate-900">{slide.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{slide.caption || "No caption"}</p>
                        {slide.buttonEnabled ? (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            CTA: {slide.buttonText || "Explore Courses"} {"->"}{" "}
                            {slide.buttonHref || "/courses"}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleMove(slide.id, "up")}
                            disabled={reordering || index === 0}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Move Up
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(slide.id, "down")}
                            disabled={reordering || index === slides.length - 1}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Move Down
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(slide)}
                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slide.id)}
                            disabled={deleting}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </section>
    </RequireAuth>
  );
}
