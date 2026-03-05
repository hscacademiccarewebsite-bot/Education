"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";
import {
  useCreateBatchMutation,
  useDeleteBatchMutation,
  useListBatchesQuery,
  useUpdateBatchMutation,
} from "@/lib/features/batch/batchApi";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { CourseIcon, FeeIcon } from "@/components/icons/PortalIcons";
import ImageUploadField from "@/components/uploads/ImageUploadField";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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
    setMessage("");
    setError("");
  };

  const closeEditForm = () => {
    setEditCourseId(null);
    setEditForm(initialCourseForm);
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setMessage("");
    setError("");
  };

  const closeCreateModal = () => {
    if (creatingCourse) {
      return;
    }
    setShowCreateModal(false);
  };

  useEffect(() => {
    if (!showCreateModal) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCreateModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCreateModal, creatingCourse]);

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
      setShowCreateModal(false);
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

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* ── Premium Hero Section ── */}
      <section className="relative overflow-hidden bg-slate-900 py-6 lg:py-8">
        {/* Animated Background Blobs */}
        <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 animate-pulse rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

        <div className="container-page relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-4xl">
              <nav className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400/80">
                <Link href="/" className="transition hover:text-cyan-300">Home</Link>
                <span className="text-slate-600">/</span>
                <span>Courses</span>
              </nav>
              
              <h1 className="text-2xl font-black tracking-tight text-white [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-3xl lg:leading-[1.1]">
                Unlock Your <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Academic Potential</span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">
                Join thousands of students in our structured, high-impact courses designed for excellence in HSC and Admission.
              </p>

              {adminRole && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="group relative flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-xl transition hover:-translate-y-1 hover:bg-slate-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    Create New Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Management Bar (Filters & Search) ── */}
      <section className="sticky top-[64px] z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="container-page py-3">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
              {["all", "active", "upcoming", "archived"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    statusFilter === status
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[280px] max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full rounded-2xl bg-slate-100 px-11 py-3 text-sm font-medium text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-12">
        {message && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {adminRole && editCourseId && (
          <div className="mb-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Modify Course</h2>
                  <p className="text-sm text-slate-500">Update essential details for {selectedEditCourse?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Course Name</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g., HSC Physics Premium"
                    className={fieldClass()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">URL Slug</label>
                  <div className="flex gap-2">
                    <input
                      required
                      value={editForm.slug}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))}
                      className={fieldClass()}
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Facebook Group</label>
                  <input
                    required
                    type="url"
                    value={editForm.facebookGroupUrl}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, facebookGroupUrl: event.target.value }))}
                    placeholder="https://facebook.com/groups/..."
                    className={fieldClass()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Monthly Fee (BDT)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editForm.monthlyFee}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, monthlyFee: event.target.value }))}
                    className={fieldClass()}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Visibility Status</label>
                  <div className="flex flex-wrap gap-3">
                    {["active", "upcoming", "archived"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, status: s }))}
                        className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                          editForm.status === s
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Marketing Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={4}
                    className={fieldClass()}
                  />
                </div>

                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Course Cover Image"
                    folder="hsc-academic/courses"
                    asset={editForm.bannerUrl ? { url: editForm.bannerUrl, publicId: editForm.bannerPublicId } : null}
                    onChange={(asset) => {
                      setEditForm((prev) => ({
                        ...prev,
                        bannerUrl: asset?.url || "",
                        bannerPublicId: asset?.publicId || "",
                      }));
                      setError("");
                    }}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-8">
                <button
                  type="submit"
                  disabled={updatingCourse}
                  className="rounded-2xl bg-cyan-600 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-cyan-200 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:opacity-50"
                >
                  {updatingCourse ? "Updating..." : "Save All Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(selectedEditCourse)}
                  disabled={deletingCourse}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-8 py-4 text-sm font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-100"
                >
                  Delete Permanently
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-slate-200 bg-white py-20 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900">No courses found</h3>
            <p className="mt-2 text-slate-500">We couldn't find any courses matching your filter.</p>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800"
            >
              Show all courses
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course, index) => {
              const enrollment = enrollmentMap.get(course._id);
              const meta = statusMeta[course.status] || statusMeta.archived;
              const bannerUrl = course?.banner?.url || course?.thumbnail?.url || coverFallbacks[index % coverFallbacks.length];

              return (
                <article
                  key={course._id}
                  className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={bannerUrl}
                      alt={course.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute right-4 top-4">
                      <span className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${meta.pillClass.replace('bg-', 'bg-')}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600">
                        <span>Course</span>
                        <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                        <span>Featured</span>
                      </div>
                      <h2 className="mt-2 text-lg font-black leading-tight text-slate-900 group-hover:text-cyan-700 transition line-clamp-1">
                        {course.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {course.description || "Specialized academic modules for success."}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monthly Fee</p>
                        <p className="text-base font-black text-slate-900">
                          {formatCurrency(course.monthlyFee, course.currency || "BDT")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/courses/${course._id}`}
                        className="flex items-center justify-center rounded-xl bg-slate-900 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-cyan-700 hover:shadow-lg hover:shadow-cyan-200"
                      >
                        Explore
                      </Link>

                      {studentRole ? (
                        enrollment ? (
                          <span className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {enrollment.status}
                          </span>
                        ) : (
                          <Link
                            href={`/enrollments?batchId=${course._id}`}
                            className="flex items-center justify-center rounded-xl border-2 border-emerald-500 bg-white text-[10px] font-black uppercase tracking-widest text-emerald-600 transition hover:bg-emerald-50"
                          >
                            Apply
                          </Link>
                        )
                      ) : adminRole ? (
                        <button
                          type="button"
                          onClick={() => openEditForm(course)}
                          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 shadow-sm"
                        >
                          Modify
                        </button>
                      ) : (
                        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-300">
                           Student Only
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {adminRole && showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={closeCreateModal} />
          
          <div className="relative z-10 w-full max-w-4xl max-h-[90svh] overflow-y-auto rounded-[40px] border border-white/20 bg-white p-1 shadow-2xl animate-in zoom-in-95 duration-300 no-scrollbar">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-8 py-6 backdrop-blur-sm">
               <div>
                  <h2 className="text-3xl font-black text-slate-900">New Expedition</h2>
                  <p className="text-sm text-slate-500">Initiate a new high-impact academic course module.</p>
               </div>
               <button onClick={closeCreateModal} className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-8">
               <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Title</label>
                    <input
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Higher Math - Integration Special"
                      className={fieldClass()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Slug</label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={createForm.slug}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value }))}
                        className={fieldClass()}
                      />
                      <button
                        type="button"
                        onClick={() => setCreateForm(prev => ({ ...prev, slug: toSlug(prev.name) }))}
                        className="rounded-xl bg-slate-100 px-4 text-xs font-black uppercase text-slate-700 transition hover:bg-slate-200"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Description</label>
                    <textarea
                      required
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Briefly describe what this course covers..."
                      rows={3}
                      className={fieldClass()}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">FB Community Link</label>
                    <input
                      required
                      type="url"
                      value={createForm.facebookGroupUrl}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, facebookGroupUrl: e.target.value }))}
                      className={fieldClass()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Fee (BDT)</label>
                    <input
                      required
                      type="number"
                      value={createForm.monthlyFee}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, monthlyFee: e.target.value }))}
                      className={fieldClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <ImageUploadField
                      label="Visual Banner"
                      folder="hsc-academic/courses"
                      asset={createForm.bannerUrl ? { url: createForm.bannerUrl, publicId: createForm.bannerPublicId } : null}
                      onChange={(asset) => {
                        setCreateForm(prev => ({ ...prev, bannerUrl: asset?.url || "", bannerPublicId: asset?.publicId || "" }));
                        setError("");
                      }}
                    />
                  </div>
               </div>

               <div className="mt-10 flex border-t border-slate-100 pt-8">
                  <button
                    type="submit"
                    disabled={creatingCourse}
                    className="w-full rounded-[20px] bg-slate-900 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-200 transition hover:-translate-y-1 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creatingCourse ? "Forging Course..." : "Launch Course Module"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
