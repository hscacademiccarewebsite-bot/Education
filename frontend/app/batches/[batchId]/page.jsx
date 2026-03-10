"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useSelector } from "react-redux";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import { ChapterIcon, SubjectIcon } from "@/components/icons/PortalIcons";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput } from "@/components/forms/FloatingField";
import { auth } from "@/firebase.config";
import { useGetBatchByIdQuery } from "@/lib/features/batch/batchApi";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import {
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useListSubjectsQuery,
  useUpdateSubjectMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { canManageContent, isStudent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const COURSE_FALLBACK =
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=70";

const initialSubjectForm = {
  title: "",
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

function enrollmentTone(status) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-slate-100 text-slate-700";
}

function enrollmentLabel(status, t) {
  if (status === "approved") {
    return t ? t("batchDetails.status.approved", "Approved") : "Approved";
  }
  if (status === "pending") {
    return t ? t("batchDetails.status.applied", "Applied (Pending)") : "Applied (Pending)";
  }
  if (status === "rejected") {
    return t ? t("batchDetails.status.rejected", "Rejected") : "Rejected";
  }
  return t ? t("batchDetails.status.notApplied", "Not Applied") : "Not Applied";
}

function studentActionLabel(status, t) {
  if (status === "rejected") {
    return t ? t("batchDetails.actions.applyAgain", "Apply Again") : "Apply Again";
  }
  return t ? t("batchDetails.actions.applyCourse", "Apply for Course") : "Apply for Course";
}

function SubjectDirectoryCard({ subject, index, canManage, onEdit, onDelete, deletingSubject, t }) {
  return (
    <article className="group rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <SubjectIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{t("batchDetails.subjectCard.node", "Subject Node")}</p>
            <h3 className="mt-1 truncate text-base font-black text-slate-950 md:text-lg">{subject.title}</h3>
          </div>
        </div>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">{t("batchDetails.subjectCard.active", "Active")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <SubjectIcon className="h-3.5 w-3.5" />
          Subject Layer
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <ChapterIcon className="h-3.5 w-3.5" />
          Next: Chapters
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/subjects/${subject._id}`} className="site-button-primary px-4 py-2 text-xs">{t("batchDetails.actions.openSubject", "Open Subject")}</Link>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(subject)}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
            >{t("batchDetails.actions.edit", "Edit")}</button>
            <button
              type="button"
              onClick={() => onDelete(subject)}
              disabled={deletingSubject}
              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
            >{t("batchDetails.actions.delete", "Delete")}</button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params?.batchId || params?.courseId;
  const { t } = useSiteLanguage();

  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);
  const studentRole = isStudent(role);

  const { data: batchData, isLoading: batchLoading } = useGetBatchByIdQuery(batchId, {
    skip: !batchId,
  });
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !studentRole,
  });

  const myBatchEnrollment = useMemo(
    () =>
      (myEnrollmentsData?.data || []).find(
        (request) => String(request.batch?._id || request.batch) === String(batchId)
      ),
    [myEnrollmentsData, batchId]
  );
  const studentEnrollmentStatus = String(myBatchEnrollment?.status || "");
  const studentApproved = studentRole && studentEnrollmentStatus === "approved";
  const canAccessCourseContent = canManage || studentApproved;
  const shouldPromptSignIn = !role;

  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    isError: subjectsIsError,
    error: subjectsError,
  } = useListSubjectsQuery(batchId, {
    skip: !batchId || !canAccessCourseContent,
  });

  const [createSubject, { isLoading: creatingSubject }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: updatingSubject }] = useUpdateSubjectMutation();
  const [deleteSubject, { isLoading: deletingSubject }] = useDeleteSubjectMutation();

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectForm, setSubjectForm] = useState(initialSubjectForm);
  const [editingSubjectId, setEditingSubjectId] = useState("");
  const [editingSubjectTitle, setEditingSubjectTitle] = useState("");
  const [subjectMessage, setSubjectMessage] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { showSuccess, showError, requestDeleteConfirmation, popupNode } = useActionPopup();

  const batch = batchData?.data;
  const subjects = subjectsData?.data || [];

  const openCreatePanel = () => {
    setEditingSubjectId("");
    setEditingSubjectTitle("");
    setSubjectForm(initialSubjectForm);
    setShowSubjectForm((prev) => !prev || Boolean(editingSubjectId));
    setSubjectMessage("");
    setSubjectError("");
  };

  const openEditSubject = (subject) => {
    setEditingSubjectId(subject._id);
    setEditingSubjectTitle(subject.title || "");
    setShowSubjectForm(false);
    setSubjectMessage("");
    setSubjectError("");
  };

  const closeManagementPanel = () => {
    setShowSubjectForm(false);
    setEditingSubjectId("");
    setEditingSubjectTitle("");
  };

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    setSubjectMessage("");
    setSubjectError("");

    if (!subjectForm.title.trim()) {
      const validationMessage = t("batchDetails.messages.subjectReq", "Subject title is required.");
      setSubjectError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await createSubject({
        batchId,
        title: subjectForm.title.trim(),
      }).unwrap();

      setSubjectMessage(t("batchDetails.messages.createdSuccess", "Subject created successfully."));
      showSuccess(t("batchDetails.messages.createdSuccess", "Subject created successfully."));
      setSubjectForm(initialSubjectForm);
      setShowSubjectForm(false);
    } catch (createError) {
      const resolvedError = normalizeApiError(createError, "Failed to create subject.");
      setSubjectError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleUpdateSubject = async (event) => {
    event.preventDefault();
    setSubjectMessage("");
    setSubjectError("");

    if (!editingSubjectId || !editingSubjectTitle.trim()) {
      const validationMessage = t("batchDetails.messages.subjectReq", "Subject title is required.");
      setSubjectError(validationMessage);
      showError(validationMessage);
      return;
    }

    try {
      await updateSubject({
        subjectId: editingSubjectId,
        batchId,
        title: editingSubjectTitle.trim(),
      }).unwrap();

      setSubjectMessage(t("batchDetails.messages.updatedSuccess", "Subject updated successfully."));
      showSuccess(t("batchDetails.messages.updatedSuccess", "Subject updated successfully."));
      closeManagementPanel();
    } catch (updateError) {
      const resolvedError = normalizeApiError(updateError, "Failed to update subject.");
      setSubjectError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = await requestDeleteConfirmation({
      title: t("batchDetails.messages.deleteConfirmTitle", `Delete "${subject.title}"?`, { title: subject.title }),
      message:
        t("batchDetails.messages.deleteConfirmMsg", "All chapters and videos inside this subject will be removed permanently. Type DELETE to continue."),
      approveLabel: t("batchDetails.messages.deleteBtn", "Delete Subject"),
    });
    if (!confirmed) {
      return;
    }

    setSubjectMessage("");
    setSubjectError("");

    try {
      await deleteSubject({
        subjectId: subject._id,
        batchId,
      }).unwrap();

      setSubjectMessage(t("batchDetails.messages.deletedSuccess", "Subject deleted successfully."));
      showSuccess(t("batchDetails.messages.deletedSuccess", "Subject deleted successfully."));
      if (editingSubjectId === subject._id) {
        closeManagementPanel();
      }
    } catch (deleteError) {
      const resolvedError = normalizeApiError(deleteError, "Failed to delete subject.");
      setSubjectError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleFirebaseLogin = async () => {
    setLoginError("");
    setLoginLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoginError(error?.message || "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (batchLoading) {
    return (
      <section className="container-page py-10">
        <CardSkeleton />
      </section>
    );
  }

  if (!batch) {
    return (
      <section className="container-page py-10">
        <MessageBanner tone="error">Course not found or access denied.</MessageBanner>
      </section>
    );
  }

  const managementOpen = canManage && (showSubjectForm || Boolean(editingSubjectId));
  const courseStatus = String(batch.status || "active");
  const courseStatusTone =
    courseStatus === "active"
      ? "bg-emerald-100 text-emerald-700"
      : courseStatus === "upcoming"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";
  const studentStatusMessage =
    studentEnrollmentStatus === "approved"
      ? t("batchDetails.messages.enrollApproved", "Your enrollment is approved. You can access all course content.")
      : studentEnrollmentStatus === "pending"
      ? t("batchDetails.messages.enrollPending", "Your application is under review.")
      : studentEnrollmentStatus === "rejected"
      ? t("batchDetails.messages.enrollRejected", "Your previous application was rejected. You can apply again.")
      : t("batchDetails.messages.enrollNotApplied", "You have not applied to this course yet.");
  const accessLabel = studentRole
    ? enrollmentLabel(studentEnrollmentStatus, t)
    : shouldPromptSignIn
    ? t("batchDetails.messages.signInRequired", "Sign In Required")
    : t("batchDetails.messages.staffAccess", "Staff Access");
  const accessTone = studentRole
    ? enrollmentTone(studentEnrollmentStatus)
    : shouldPromptSignIn
    ? "bg-slate-100 text-slate-700"
    : "bg-emerald-100 text-emerald-700";
  const accessMessage = studentRole
    ? studentStatusMessage
    : shouldPromptSignIn
    ? t("batchDetails.messages.signInPrompt", "Sign in as a student to apply and track enrollment.")
    : t("batchDetails.messages.staffPrompt", "You can manage course structure and subject content from here.");
  const primaryAccessAction = studentRole
    ? studentApproved || studentEnrollmentStatus === "pending"
      ? null
      : {
          type: "link",
          href: `/enrollments?batchId=${batchId}`,
          label: studentActionLabel(studentEnrollmentStatus, t),
        }
    : shouldPromptSignIn
    ? {
        type: "login",
        label: t("batchDetails.actions.login", "Login"),
      }
    : null;

  return (
    <main className="site-shell min-h-screen pb-20">
      <section className="container-page space-y-6 py-8 md:py-10">
        <div className="grid gap-6 border-b border-slate-200 pb-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <section className="overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{t("batchDetails.layout.courseDetails", "Course Details")}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${courseStatusTone}`}
                  >
                    {courseStatus}
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {batch.name}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  {batch.description ||
                    t("batchDetails.layout.defaultDesc", "This course is organized by subject, chapter, and video with guided academic progression.")}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/courses"
                    className="site-button-secondary inline-flex items-center gap-2"
                  >
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>{t("batchDetails.actions.allCourses", "All Courses")}</Link>
                  {batch.facebookGroupUrl ? (
                    <a
                      href={batch.facebookGroupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="site-button-secondary inline-flex items-center gap-2"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h9m-9 4.5h6m-7.5 7.5h12a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 18 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5Z" />
                      </svg>{t("batchDetails.actions.fbGroup", "Facebook Group")}</a>
                  ) : null}
                  {canManage ? (
                    <button type="button" onClick={openCreatePanel} className="site-button-primary">
                      {showSubjectForm && !editingSubjectId ? t("batchDetails.actions.closePopup", "Close Popup") : t("batchDetails.actions.createSubject", "Create Subject")}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-100">
                <img
                  src={batch?.banner?.url || batch?.thumbnail?.url || COURSE_FALLBACK}
                  alt={batch.name}
                  className="h-[145px] w-full object-cover md:h-[175px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-900/5 to-transparent" />
                <p className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">{t("batchDetails.layout.coursePreview", "Course Preview")}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-4 md:px-7">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{t("batchDetails.layout.quickFacts", "Quick Facts")}</p>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{t("batchDetails.layout.monthlyFee", "Monthly Fee")}</dt>
                  <dd className="mt-1 text-sm font-black text-slate-900">{batch.monthlyFee || 0} BDT</dd>
                </div>
                <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{t("batchDetails.layout.visibility", "Visibility")}</dt>
                  <dd className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
                    {courseStatus}
                  </dd>
                </div>
                <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{t("batchDetails.layout.subjects", "Subjects")}</dt>
                  <dd className="mt-1 text-sm font-black text-slate-900">
                    {canAccessCourseContent ? subjects.length : t("batchDetails.layout.locked", "Locked")}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <aside className="space-y-4 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)] md:p-6 xl:sticky xl:top-24">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{t("batchDetails.layout.accessEnrollment", "Access & Enrollment")}</p>
            <span
              className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${accessTone}`}
            >
              {accessLabel}
            </span>
            <p className="text-sm text-slate-600 md:text-base">{accessMessage}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {canAccessCourseContent
                ? t("batchDetails.messages.contentUnlocked", "Course content is unlocked for your account.")
                : t("batchDetails.messages.contentLocked", "Course content will unlock after access approval.")}
            </p>
            {primaryAccessAction?.type === "login" ? (
              <button
                type="button"
                onClick={handleFirebaseLogin}
                disabled={loginLoading}
                className="site-button-primary mt-1 inline-flex disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loginLoading ? t("batchDetails.actions.loggingIn", "Logging In...") : primaryAccessAction.label}
              </button>
            ) : primaryAccessAction?.type === "link" ? (
              <Link href={primaryAccessAction.href} className="site-button-primary mt-1 inline-flex">
                {primaryAccessAction.label}
              </Link>
            ) : null}
            {loginError ? <p className="text-xs font-semibold text-rose-700">{loginError}</p> : null}
          </aside>
        </div>

        <div className="space-y-4">
          {canAccessCourseContent && subjectsIsError ? (
            <MessageBanner tone="warning">
              {subjectsError?.data?.message ||
                t("batchDetails.messages.noAccessYet", "You do not have access to this course content yet. Enrollment approval is required for students.")}
            </MessageBanner>
          ) : null}
        </div>

        {canAccessCourseContent ? (
          <div className="mt-8">
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="site-kicker">{t("batchDetails.layout.subjectDirectory", "Subject Directory")}</p>
                  <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-3xl">{t("batchDetails.layout.courseSubjects", "Course subjects")}</h2>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {subjects.length} {t("batchDetails.layout.total", "total")}</p>
              </div>

              {subjectsLoading ? (
                <div className="site-panel rounded-[clamp(8px,5%,12px)] p-5">
                  <ListSkeleton rows={3} />
                </div>
              ) : subjects.length === 0 ? (
                <div className="site-panel rounded-[clamp(8px,5%,12px)] py-12 text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <SubjectIcon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-2xl font-black text-slate-950">{t("batchDetails.layout.noSubjects", "No subjects yet")}</p>
                  <p className="mt-3 text-sm text-slate-600">{t("batchDetails.layout.createFirstSubject", "Create the first subject to begin structuring this course.")}</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {subjects.map((subject, index) => (
                    <SubjectDirectoryCard
                      key={subject._id}
                      subject={subject}
                      index={index}
                      canManage={canManage}
                      onEdit={openEditSubject}
                      onDelete={handleDeleteSubject}
                      deletingSubject={deletingSubject}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-8 border-y border-slate-200 py-8">
            <p className="site-kicker">{t("batchDetails.layout.courseContent", "Course Content")}</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-3xl">{t("batchDetails.layout.contentAppearsHere", "Content will appear here after access approval")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Once your access is approved, you will see all course subjects and can continue into
              chapters and lessons from this section.
            </p>
          </div>
        )}

        {canAccessCourseContent && managementOpen ? (
          <div
            className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
            onClick={closeManagementPanel}
          >
            <aside
              className="site-panel animate-scale-in max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="site-kicker">{editingSubjectId ? t("batchDetails.layout.updateSubject", "Update Subject") : t("batchDetails.actions.createSubject", "Create Subject")}</p>
                  <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-3xl">
                    {editingSubjectId ? t("batchDetails.layout.editMetadata", "Edit subject metadata") : t("batchDetails.layout.registerNew", "Register new subject")}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Keep subject titles clear and academic. This is the root record for chapter and video hierarchy.
                  </p>
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
                onSubmit={editingSubjectId ? handleUpdateSubject : handleCreateSubject}
                className="mt-6 space-y-4"
              >
                <FloatingInput
                  required
                  label={t("batchDetails.layout.subjectTitle", "Subject Title")}
                  value={editingSubjectId ? editingSubjectTitle : subjectForm.title}
                  onChange={(event) =>
                    editingSubjectId
                      ? setEditingSubjectTitle(event.target.value)
                      : setSubjectForm({ title: event.target.value })
                  }
                  hint={t("batchDetails.layout.subjectHint", "e.g., Physics")}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Naming Tip
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Use concise academic names such as Physics, Higher Math, Biology, or Chemistry.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={creatingSubject || updatingSubject}
                    className="site-button-primary"
                  >
                    {editingSubjectId
                      ? updatingSubject
                        ? t("batchDetails.actions.saving", "Saving...")
                        : t("batchDetails.actions.saveSubject", "Save Subject")
                      : creatingSubject
                      ? t("batchDetails.actions.creating", "Creating...")
                      : t("batchDetails.actions.createSubject", "Create Subject")}
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
    </main>
  );
}
