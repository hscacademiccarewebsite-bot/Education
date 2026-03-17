"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import PageHero from "@/components/layouts/PageHero";
import CourseCatalogCard from "@/components/course/CourseCatalogCard";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
import {
  useCreateBatchMutation,
  useDeleteBatchMutation,
  useListBatchesQuery,
  useUpdateBatchMutation,
} from "@/lib/features/batch/batchApi";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

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

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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
  const { t } = useSiteLanguage();
  const role = useSelector(selectCurrentUserRole);
  const adminRole = role === "admin";
  const teacherRole = role === "teacher";
  const studentRole = isStudent(role);
  const canManage = adminRole || teacherRole;

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
  const [portalMounted, setPortalMounted] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();

  const courses = coursesData?.data || [];

  const enrollmentMap = useMemo(() => {
    const map = new Map();
    (myEnrollmentsData?.data || []).forEach((item) => {
      map.set(item.batch?._id || item.batch, item);
    });
    return map;
  }, [myEnrollmentsData]);

  const selectedEditCourse = useMemo(
    () => courses.find((course) => course._id === editCourseId),
    [courses, editCourseId]
  );
  const showEditModal = canManage && Boolean(editCourseId);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  const openEditForm = (course) => {
    setEditCourseId(course._id);
    setEditForm(mapCourseToForm(course));
    setMessage("");
    setError("");
  };

  const closeEditForm = () => {
    if (updatingCourse || deletingCourse) {
      return;
    }
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
    if (!showCreateModal && !showEditModal) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (showCreateModal) {
        closeCreateModal();
      }
      if (showEditModal) {
        closeEditForm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCreateModal, showEditModal, creatingCourse, updatingCourse, deletingCourse]);

  useEffect(() => {
    if (!showCreateModal && !showEditModal) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCreateModal, showEditModal]);

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!createForm.bannerUrl.trim()) {
      const validationMessage = t("batchesPage.messages.uploadBannerReq", "Upload a course banner before creating the course.");
      setError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await createCourse(toCoursePayload(createForm)).unwrap();
      setMessage(t("batchesPage.messages.createSuccess", "Course created successfully."));
      showSuccess(t("batchesPage.messages.createSuccess", "Course created successfully."));
      setCreateForm(initialCourseForm);
      setShowCreateModal(false);
    } catch (createError) {
      const resolvedError = createError?.data?.message || t("batchesPage.messages.createFail", "Failed to create course.");
      setError(resolvedError);
      showError(resolvedError);
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
      setMessage(t("batchesPage.messages.updateSuccess", "Course updated successfully."));
      showSuccess(t("batchesPage.messages.updateSuccess", "Course updated successfully."));
      closeEditForm();
    } catch (updateError) {
      const resolvedError = updateError?.data?.message || t("batchesPage.messages.updateFail", "Failed to update course.");
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("batchesPage.messages.deleteConfirmTitle", `Delete "${course.name}"?`, { course: course.name }),
      message:
        t("batchesPage.messages.deleteConfirmMsg", "This will permanently remove related subjects, chapters, videos, enrollments, and payment records."),
      approveLabel: t("batchesPage.actions.deleteCourse", "Delete Course"),
    });
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteCourse(course._id).unwrap();
      setMessage(t("batchesPage.messages.deleteSuccess", "Course deleted successfully."));
      showSuccess(t("batchesPage.messages.deleteSuccess", "Course deleted successfully."));
      if (editCourseId === course._id) {
        closeEditForm();
      }
    } catch (deleteError) {
      const resolvedError = deleteError?.data?.message || t("batchesPage.messages.deleteFail", "Failed to delete course.");
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <main className="site-shell min-h-screen pb-20">
      <section className="container-page pt-8 pb-0 md:pt-10 md:pb-0">
        {adminRole ? (
          <RevealSection noStagger className="mb-4 flex flex-wrap gap-3">
            <RevealItem>
              <button type="button" onClick={openCreateModal} className="site-button-primary">
                {t("batchesPage.actions.createNew", "Create New Course")}
              </button>
            </RevealItem>
          </RevealSection>
        ) : null}
        <RevealSection noStagger>
          <RevealItem>
            <PageHero
              eyebrow={t("batchesPage.hero.eyebrow")}
              titleAccent={t("batchesPage.hero.accent")}
              title={t("batchesPage.hero.title")}
              description={t("batchesPage.hero.description")}
            />
          </RevealItem>
        </RevealSection>
      </section>

      <div className="container-page mt-0">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <RevealSection noStagger>
            <RevealItem className="flex flex-col items-center justify-center rounded-[5%] border border-slate-200 bg-white py-20 text-center shadow-[0_8px_20px_rgba(15,23,42,0.1)]">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[5%] bg-slate-50 text-slate-300">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">{t("batchesPage.empty.title", "No courses found")}</h3>
              <p className="mt-2 text-slate-500">{t("batchesPage.empty.desc", "No courses are available right now.")}</p>
            </RevealItem>
          </RevealSection>
        ) : (
          <RevealSection className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course, index) => {
              const enrollment = enrollmentMap.get(course._id);
              const enrollmentStatus = String(enrollment?.status || "");
              const studentApproved = studentRole && enrollmentStatus === "approved";
              const showApplyAction =
                studentRole && !studentApproved && enrollmentStatus !== "pending";

              return (
                <RevealItem key={course._id}>
                  <CourseCatalogCard
                    course={course}
                    index={index}
                    showApplyAction={showApplyAction}
                    showModifyAction={canManage}
                    onModify={openEditForm}
                    enrollmentStatus={enrollmentStatus}
                    showEnrollmentStatus={studentRole}
                  />
                </RevealItem>
              );
            })}
          </RevealSection>
        )}
      </div>

      {/* ── Create Modal ── */}
      {portalMounted && adminRole && showCreateModal
        ? createPortal(
            <div
              className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
              onClick={closeCreateModal}
            >
              <aside
                className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[920px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="site-kicker">{t("batchesPage.createModal.kicker", "Create Course")}</p>
                    <h2 className="font-display mt-4 text-lg font-extrabold text-slate-950 md:text-xl">
                      {t("batchesPage.createModal.title", "Add new course details")}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {t("batchesPage.createModal.desc", "Fill all required fields to publish a course in the catalogue.")}
                    </p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                    aria-label="Close popup"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FloatingInput
                        required
                        label={t("batchesPage.form.title", "Title")}
                        value={createForm.name}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                        hint={t("batchesPage.form.titleHint", "e.g., Higher Math - Integration Special")}
                      />
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <FloatingInput
                          required
                          label={t("batchesPage.form.slug", "Slug")}
                          className="min-w-0"
                          value={createForm.slug}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setCreateForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
                          className="site-button-secondary h-[52px] self-start rounded-xl px-4 text-xs"
                        >
                          {t("batchesPage.form.auto", "Auto")}
                        </button>
                      </div>

                      <FloatingTextarea
                        required
                        label={t("batchesPage.form.description", "Description")}
                        className="md:col-span-2"
                        rows={3}
                        value={createForm.description}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                        hint={t("batchesPage.form.descHint", "Briefly describe what this course covers.")}
                      />

                      <FloatingInput
                        required
                        type="url"
                        label={t("batchesPage.form.fbLink", "FB Community Link")}
                        value={createForm.facebookGroupUrl}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, facebookGroupUrl: e.target.value }))}
                      />
                      <FloatingInput
                        required
                        type="number"
                        label={t("batchesPage.form.fee", "Fee (BDT)")}
                        value={createForm.monthlyFee}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, monthlyFee: e.target.value }))}
                      />

                      <div className="md:col-span-2">
                        <ImageUploadField
                          label={t("batchesPage.form.visualBanner", "Visual Banner")}
                          folder="hsc-academic/courses"
                          asset={
                            createForm.bannerUrl
                              ? { url: createForm.bannerUrl, publicId: createForm.bannerPublicId }
                              : null
                          }
                          onChange={(asset) => {
                            setCreateForm((prev) => ({
                              ...prev,
                              bannerUrl: asset?.url || "",
                              bannerPublicId: asset?.publicId || "",
                            }));
                            setError("");
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex border-t border-slate-100 pt-6">
                      <button
                        type="submit"
                        disabled={creatingCourse}
                        className="site-button-primary w-full py-2.5 text-xs disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {creatingCourse ? t("batchesPage.actions.creating", "Creating Course...") : t("batchesPage.actions.createCourseBtn", "Create Course")}
                      </button>
                    </div>
                </form>
              </aside>
            </div>,
            document.body
          )
        : null}

      {/* ── Edit Modal ── */}
      {portalMounted && showEditModal && selectedEditCourse
        ? createPortal(
            <div
              className="fixed inset-0 z-[270] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
              onClick={closeEditForm}
            >
              <aside
                className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[920px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="site-kicker">{t("batchesPage.editModal.kicker", "Modify Course")}</p>
                    <h2 className="font-display mt-4 text-lg font-extrabold text-slate-950 md:text-xl">
                      {t("batchesPage.editModal.title", "Update course information")}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {t("batchesPage.editModal.desc", "Update operational details for {course}.", { course: selectedEditCourse.name })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    disabled={updatingCourse || deletingCourse}
                    aria-label="Close popup"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateCourse} className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FloatingInput
                        required
                        label={t("batchesPage.form.courseName", "Course Name")}
                        value={editForm.name}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                        hint={t("batchesPage.form.courseHint", "e.g., HSC Physics Premium")}
                      />
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <FloatingInput
                          required
                          label={t("batchesPage.form.urlSlug", "URL Slug")}
                          className="min-w-0"
                          value={editForm.slug}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
                          className="site-button-secondary h-[52px] self-start rounded-xl px-4 text-xs"
                        >
                          {t("batchesPage.form.generate", "Generate")}
                        </button>
                      </div>

                      <FloatingInput
                        required
                        type="url"
                        label={t("batchesPage.form.fbGroup", "Facebook Group")}
                        value={editForm.facebookGroupUrl}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, facebookGroupUrl: event.target.value }))
                        }
                      />
                      <FloatingInput
                        required
                        type="number"
                        min="0"
                        label={t("batchesPage.form.monthlyFee", "Monthly Fee (BDT)")}
                        value={editForm.monthlyFee}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, monthlyFee: event.target.value }))
                        }
                      />

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="ml-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          {t("batchesPage.form.visibility", "Visibility Status")}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {["active", "upcoming", "archived"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditForm((prev) => ({ ...prev, status: s }))}
                              className={`rounded-xl px-5 py-2.5 text-xs ${
                                editForm.status === s ? "site-button-primary" : "site-button-secondary"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <FloatingTextarea
                        label={t("batchesPage.form.marketingDesc", "Marketing Description")}
                        className="md:col-span-2"
                        rows={4}
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />

                      <div className="md:col-span-2">
                        <ImageUploadField
                          label={t("batchesPage.form.courseCover", "Course Cover Image")}
                          folder="hsc-academic/courses"
                          asset={
                            editForm.bannerUrl
                              ? { url: editForm.bannerUrl, publicId: editForm.bannerPublicId }
                              : null
                          }
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

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
                      <button
                        type="submit"
                        disabled={updatingCourse || deletingCourse}
                        className="site-button-primary disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {updatingCourse ? t("batchesPage.actions.updating", "Updating...") : t("batchesPage.actions.saveAll", "Save All Changes")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(selectedEditCourse)}
                        disabled={deletingCourse || updatingCourse}
                        className="site-button-secondary disabled:opacity-50"
                      >
                        {deletingCourse ? t("batchesPage.actions.deleting", "Deleting...") : t("batchesPage.actions.deletePerm", "Delete Permanently")}
                      </button>
                    </div>
                </form>
              </aside>
            </div>,
            document.body
          )
        : null}
      {popupNode}
    </main>
  );
}
