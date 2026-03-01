"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { CardLoader, InlineLoader } from "@/components/loaders/AppLoader";
import {
  useCreateBatchMutation,
  useDeleteBatchMutation,
  useListBatchesQuery,
  useUpdateBatchMutation,
} from "@/lib/features/batch/batchApi";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { isCloudinaryUploadConfigured, uploadImageToCloudinary } from "@/lib/utils/cloudinaryUpload";
import { CourseIcon, FeeIcon } from "@/components/icons/PortalIcons";

const initialCourseForm = {
  name: "",
  slug: "",
  description: "",
  facebookGroupUrl: "",
  monthlyFee: "",
  status: "active",
  bannerUrl: "",
  bannerPublicId: "",
};

const statusMeta = {
  active: {
    label: "Active",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  upcoming: {
    label: "Upcoming",
    pillClass: "bg-orange-100 text-orange-700",
  },
  archived: {
    label: "Archived",
    pillClass: "bg-slate-200 text-slate-700",
  },
};

const coverFallbacks = [
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=70",
];

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatCurrency(value, currency = "BDT") {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${currency}`;
}

function mapCourseToForm(course) {
  return {
    name: course?.name || "",
    slug: course?.slug || "",
    description: course?.description || "",
    facebookGroupUrl: course?.facebookGroupUrl || "",
    monthlyFee: String(course?.monthlyFee ?? ""),
    status: course?.status || "active",
    bannerUrl: course?.banner?.url || course?.thumbnail?.url || "",
    bannerPublicId: course?.banner?.publicId || course?.thumbnail?.publicId || "",
  };
}

function toCoursePayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    facebookGroupUrl: form.facebookGroupUrl.trim(),
    monthlyFee: Number(form.monthlyFee),
    status: form.status,
    banner: form.bannerUrl.trim()
      ? {
          url: form.bannerUrl.trim(),
          publicId: form.bannerPublicId.trim(),
        }
      : null,
  };
}

export default function CoursesPage() {
  const role = useSelector(selectCurrentUserRole);
  const adminRole = isAdmin(role);
  const studentRole = isStudent(role);

  const { data: coursesData, isLoading } = useListBatchesQuery();
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !studentRole,
  });

  const [createCourse, { isLoading: creatingCourse }] = useCreateBatchMutation();
  const [updateCourse, { isLoading: updatingCourse }] = useUpdateBatchMutation();
  const [deleteCourse, { isLoading: deletingCourse }] = useDeleteBatchMutation();

  const [createForm, setCreateForm] = useState(initialCourseForm);
  const [editCourseId, setEditCourseId] = useState(null);
  const [editForm, setEditForm] = useState(initialCourseForm);
  const [statusFilter, setStatusFilter] = useState("all");

  const [createBannerFile, setCreateBannerFile] = useState(null);
  const [editBannerFile, setEditBannerFile] = useState(null);
  const [uploadingCreateBanner, setUploadingCreateBanner] = useState(false);
  const [uploadingEditBanner, setUploadingEditBanner] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const courses = coursesData?.data || [];

  const enrollmentMap = useMemo(() => {
    const map = new Map();
    (myEnrollmentsData?.data || []).forEach((item) => {
      map.set(item.batch?._id || item.batch, item);
    });
    return map;
  }, [myEnrollmentsData]);

  const filteredCourses = useMemo(() => {
    if (statusFilter === "all") {
      return courses;
    }
    return courses.filter((course) => course.status === statusFilter);
  }, [courses, statusFilter]);

  const selectedEditCourse = useMemo(
    () => courses.find((course) => course._id === editCourseId),
    [courses, editCourseId]
  );

  const openEditForm = (course) => {
    setEditCourseId(course._id);
    setEditForm(mapCourseToForm(course));
    setEditBannerFile(null);
    setMessage("");
    setError("");
  };

  const closeEditForm = () => {
    setEditCourseId(null);
    setEditForm(initialCourseForm);
    setEditBannerFile(null);
  };

  const handleCreateBannerUpload = async () => {
    if (!createBannerFile) {
      setError("Select a banner image first.");
      return;
    }

    setError("");
    setUploadingCreateBanner(true);
    try {
      const uploaded = await uploadImageToCloudinary(createBannerFile);
      setCreateForm((prev) => ({
        ...prev,
        bannerUrl: uploaded.url,
        bannerPublicId: uploaded.publicId,
      }));
      setMessage("Course banner uploaded successfully.");
    } catch (uploadError) {
      setError(uploadError?.message || "Failed to upload course banner.");
    } finally {
      setUploadingCreateBanner(false);
    }
  };

  const handleEditBannerUpload = async () => {
    if (!editBannerFile) {
      setError("Select a banner image first.");
      return;
    }

    setError("");
    setUploadingEditBanner(true);
    try {
      const uploaded = await uploadImageToCloudinary(editBannerFile);
      setEditForm((prev) => ({
        ...prev,
        bannerUrl: uploaded.url,
        bannerPublicId: uploaded.publicId,
      }));
      setMessage("Course banner uploaded successfully.");
    } catch (uploadError) {
      setError(uploadError?.message || "Failed to upload course banner.");
    } finally {
      setUploadingEditBanner(false);
    }
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!createForm.bannerUrl.trim()) {
      setError("Upload a course banner before creating the course.");
      return;
    }

    try {
      await createCourse(toCoursePayload(createForm)).unwrap();
      setMessage("Course created successfully.");
      setCreateForm(initialCourseForm);
      setCreateBannerFile(null);
    } catch (createError) {
      setError(createError?.data?.message || "Failed to create course.");
    }
  };

  const handleUpdateCourse = async (event) => {
    event.preventDefault();
    if (!editCourseId) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await updateCourse({
        batchId: editCourseId,
        ...toCoursePayload(editForm),
      }).unwrap();
      setMessage("Course updated successfully.");
      closeEditForm();
    } catch (updateError) {
      setError(updateError?.data?.message || "Failed to update course.");
    }
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(
      `Delete "${course.name}"?\n\nThis will permanently remove related subjects, chapters, videos, enrollments, and payment records.`
    );
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteCourse(course._id).unwrap();
      setMessage("Course deleted successfully.");
      if (editCourseId === course._id) {
        closeEditForm();
      }
    } catch (deleteError) {
      setError(deleteError?.data?.message || "Failed to delete course.");
    }
  };

  const cloudinaryReady = isCloudinaryUploadConfigured();

  return (
    <section className="container-page py-8">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(125deg,#0b3b91_0%,#0f5fb1_45%,#099a8b_100%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute -left-14 -top-10 h-52 w-52 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Course Management</p>
            <h1 className="mt-2 text-3xl font-black [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-4xl">
              Courses Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100">
              Create, update, and organize courses with banner media, fee configuration, and structured content flow.
            </p>
          </div>

          <div className="flex gap-2 rounded-full border border-white/25 bg-white/10 px-2 py-1 backdrop-blur-sm">
            {["all", "active", "upcoming", "archived"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition ${
                  statusFilter === status
                    ? "bg-white text-slate-900"
                    : "text-white/85 hover:bg-white/20"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {adminRole && editCourseId ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_15px_35px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Edit Course</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                {selectedEditCourse?.name || "Selected Course"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeEditForm}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleUpdateCourse} className="grid gap-3 md:grid-cols-2">
            <input
              required
              value={editForm.name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Course name"
              className={fieldClass()}
            />
            <div className="flex gap-2">
              <input
                required
                value={editForm.slug}
                onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="Slug"
                className={fieldClass()}
              />
              <button
                type="button"
                onClick={() => setEditForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
              >
                Auto
              </button>
            </div>

            <input
              required
              type="url"
              value={editForm.facebookGroupUrl}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, facebookGroupUrl: event.target.value }))
              }
              placeholder="Facebook Group URL"
              className={fieldClass()}
            />
            <input
              required
              type="number"
              min="0"
              value={editForm.monthlyFee}
              onChange={(event) => setEditForm((prev) => ({ ...prev, monthlyFee: event.target.value }))}
              placeholder="Monthly Fee"
              className={fieldClass()}
            />

            <select
              value={editForm.status}
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
              className={fieldClass()}
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="archived">Archived</option>
            </select>

            <textarea
              value={editForm.description}
              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Course description"
              className={`${fieldClass()} md:col-span-2`}
              rows={3}
            />

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Banner Upload</p>
              {cloudinaryReady ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditBannerFile(event.target.files?.[0] || null)}
                    className="text-xs text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={handleEditBannerUpload}
                    disabled={uploadingEditBanner}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
                  >
                    {uploadingEditBanner ? "Uploading..." : "Upload Banner"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  Cloudinary upload is not configured. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
                  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
                </p>
              )}

              {editForm.bannerUrl ? (
                <img
                  src={editForm.bannerUrl}
                  alt="Course banner preview"
                  className="mt-3 h-28 w-full rounded-xl object-cover"
                />
              ) : null}
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={updatingCourse}
                className="rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
              >
                {updatingCourse ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={closeEditForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={`mt-6 grid gap-6 ${adminRole ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
        <div>
          {isLoading ? (
            <CardLoader label="Loading courses..." />
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-lg font-bold text-slate-900">No courses found</p>
              <p className="mt-2 text-sm text-slate-600">Try another status filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredCourses.map((course, index) => {
                const enrollment = enrollmentMap.get(course._id);
                const meta = statusMeta[course.status] || statusMeta.archived;
                const bannerUrl = course?.banner?.url || course?.thumbnail?.url || coverFallbacks[index % coverFallbacks.length];

                return (
                  <article
                    key={course._id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.1)]"
                  >
                    <img src={bannerUrl} alt={course.name} className="h-44 w-full object-cover" loading="lazy" />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 text-cyan-700">
                            <CourseIcon className="h-5 w-5" />
                          </span>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
                            Course {String(index + 1).padStart(2, "0")}
                          </p>
                          <h2 className="mt-1 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                            {course.name}
                          </h2>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${meta.pillClass}`}>
                          {meta.label}
                        </span>
                      </div>

                      <p className="mt-3 min-h-[42px] text-sm text-slate-600">
                        {course.description || "Structured learning with chapter-wise content progression."}
                      </p>

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Monthly Fee</p>
                        <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-900">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                            <FeeIcon className="h-4 w-4" />
                          </span>
                          <span>{formatCurrency(course.monthlyFee, course.currency || "BDT")}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/courses/${course._id}`}
                          className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-slate-800"
                        >
                          Open Course
                        </Link>

                        {course.facebookGroupUrl ? (
                          <a
                            href={course.facebookGroupUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Group
                          </a>
                        ) : null}

                        {studentRole ? (
                          enrollment ? (
                            <span className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-sky-700">
                              {enrollment.status}
                            </span>
                          ) : (
                            <Link
                              href="/enrollments"
                              className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-sky-700 transition hover:bg-sky-100"
                            >
                              Apply
                            </Link>
                          )
                        ) : null}

                        {adminRole ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(course)}
                              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-cyan-700 transition hover:bg-cyan-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(course)}
                              disabled={deletingCourse}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {adminRole ? (
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Admin Control</p>
              <h2 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Create Course
              </h2>

              <form onSubmit={handleCreateCourse} className="mt-4 space-y-2.5">
                <input
                  required
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Course name"
                  className={fieldClass()}
                />

                <div className="flex gap-2">
                  <input
                    required
                    value={createForm.slug}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))}
                    placeholder="Slug"
                    className={fieldClass()}
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                  >
                    Auto
                  </button>
                </div>

                <input
                  required
                  type="url"
                  value={createForm.facebookGroupUrl}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, facebookGroupUrl: event.target.value }))
                  }
                  placeholder="Facebook Group URL"
                  className={fieldClass()}
                />

                <input
                  required
                  type="number"
                  min="0"
                  value={createForm.monthlyFee}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, monthlyFee: event.target.value }))}
                  placeholder="Monthly Fee"
                  className={fieldClass()}
                />

                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
                  className={fieldClass()}
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="archived">Archived</option>
                </select>

                <textarea
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Course description"
                  className={fieldClass()}
                  rows={3}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Banner Upload</p>
                  {cloudinaryReady ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setCreateBannerFile(event.target.files?.[0] || null)}
                        className="text-xs text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleCreateBannerUpload}
                        disabled={uploadingCreateBanner}
                        className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
                      >
                        {uploadingCreateBanner ? "Uploading..." : "Upload Banner"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-600">
                      Cloudinary upload is not configured. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
                      `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
                    </p>
                  )}

                  {createForm.bannerUrl ? (
                    <img
                      src={createForm.bannerUrl}
                      alt="Course banner preview"
                      className="mt-3 h-28 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {creatingCourse ? "Creating..." : "Create Course"}
                </button>
              </form>

              {(creatingCourse || updatingCourse || deletingCourse) && (
                <div className="mt-3">
                  <InlineLoader label="Saving course changes..." />
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
