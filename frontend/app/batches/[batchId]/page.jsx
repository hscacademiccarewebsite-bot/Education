"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { CardSkeleton, ListSkeleton } from "@/components/loaders/AppLoader";
import PageHero from "@/components/layouts/PageHero";
import { SubjectIcon, FeeIcon, CourseIcon } from "@/components/icons/PortalIcons";
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

const COURSE_FALLBACK =
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=70";

const initialSubjectForm = {
  title: "",
};

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
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

function enrollmentTone(status) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params?.batchId || params?.courseId;

  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);
  const studentRole = isStudent(role);

  const { data: batchData, isLoading: batchLoading } = useGetBatchByIdQuery(batchId, {
    skip: !batchId,
  });
  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    isError: subjectsIsError,
    error: subjectsError,
  } = useListSubjectsQuery(batchId, {
    skip: !batchId,
  });
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !studentRole,
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

  const batch = batchData?.data;
  const subjects = subjectsData?.data || [];
  const myBatchEnrollment = (myEnrollmentsData?.data || []).find(
    (request) => String(request.batch?._id || request.batch) === String(batchId)
  );

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
      setSubjectError("Subject title is required.");
      return;
    }

    try {
      await createSubject({
        batchId,
        title: subjectForm.title.trim(),
      }).unwrap();

      setSubjectMessage("Subject created successfully.");
      setSubjectForm(initialSubjectForm);
      setShowSubjectForm(false);
    } catch (createError) {
      setSubjectError(normalizeApiError(createError, "Failed to create subject."));
    }
  };

  const handleUpdateSubject = async (event) => {
    event.preventDefault();
    setSubjectMessage("");
    setSubjectError("");

    if (!editingSubjectId || !editingSubjectTitle.trim()) {
      setSubjectError("Subject title is required.");
      return;
    }

    try {
      await updateSubject({
        subjectId: editingSubjectId,
        batchId,
        title: editingSubjectTitle.trim(),
      }).unwrap();

      setSubjectMessage("Subject updated successfully.");
      closeManagementPanel();
    } catch (updateError) {
      setSubjectError(normalizeApiError(updateError, "Failed to update subject."));
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `Delete "${subject.title}"?\n\nAll chapters and videos inside this subject will be removed permanently.`
    );
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

      setSubjectMessage("Subject deleted successfully.");
      if (editingSubjectId === subject._id) {
        closeManagementPanel();
      }
    } catch (deleteError) {
      setSubjectError(normalizeApiError(deleteError, "Failed to delete subject."));
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

  return (
    <main className="site-shell min-h-screen pb-20">
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Course Structure"
          title={batch.name}
          description={
            batch.description ||
            "Navigate the academic tree from subject to chapter to video inside this course workspace."
          }
          actions={
            <>
              <Link href="/courses" className="site-button-secondary">
                Back To Courses
              </Link>
              {studentRole ? (
                myBatchEnrollment ? (
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${enrollmentTone(
                      myBatchEnrollment.status
                    )}`}
                  >
                    Enrollment {myBatchEnrollment.status}
                  </span>
                ) : (
                  <Link href={`/enrollments?batchId=${batchId}`} className="site-button-primary">
                    Apply For Batch
                  </Link>
                )
              ) : null}
              {batch.facebookGroupUrl ? (
                <a
                  href={batch.facebookGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-button-secondary"
                >
                  Open Facebook Group
                </a>
              ) : null}
              {canManage ? (
                <button type="button" onClick={openCreatePanel} className="site-button-primary">
                  {showSubjectForm && !editingSubjectId ? "Close Subject Form" : "Create Subject"}
                </button>
              ) : null}
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Subjects</p>
                <p className="mt-2 text-3xl font-black text-white">{subjects.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Monthly Fee</p>
                <p className="mt-2 text-3xl font-black text-white">{batch.monthlyFee || 0} BDT</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Status</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  {batch.status || "active"}
                </p>
              </div>
            </div>
          }
          className="overflow-hidden"
        />

        <div className="site-panel mt-6 overflow-hidden rounded-[32px] p-0">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8">
              <p className="site-kicker">Course Cover</p>
              <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                Guided entry into the learning tree
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Students enter through approved enrollment. Faculty then organizes the path as subject,
                chapter, and video. The course banner, fee, and Facebook group access stay visible here for
                operational clarity.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="site-stat-tile">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <CourseIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="site-stat-label">Course Space</p>
                      <p className="text-sm font-semibold text-slate-700">{batch.slug || batch._id}</p>
                    </div>
                  </div>
                </div>
                <div className="site-stat-tile">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <FeeIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="site-stat-label">Fee Model</p>
                      <p className="text-sm font-semibold text-slate-700">Monthly subscription</p>
                    </div>
                  </div>
                </div>
                <div className="site-stat-tile">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <SubjectIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="site-stat-label">Academic Units</p>
                      <p className="text-sm font-semibold text-slate-700">{subjects.length} subjects mapped</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px]">
              <img
                src={batch?.banner?.url || batch?.thumbnail?.url || COURSE_FALLBACK}
                alt={batch.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                  Private Group Required
                </p>
                <p className="mt-2 max-w-sm text-sm leading-7 text-white/80">
                  Students should request access to the private Facebook group before submitting enrollment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="site-panel-muted mt-6 rounded-[28px] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">Workflow</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Course
            </span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Subject</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Chapter</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Video</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {subjectMessage ? <MessageBanner tone="success">{subjectMessage}</MessageBanner> : null}
          {subjectError ? <MessageBanner tone="error">{subjectError}</MessageBanner> : null}
          {subjectsIsError ? (
            <MessageBanner tone="warning">
              {subjectsError?.data?.message ||
                "You do not have access to this course content yet. Enrollment approval is required for students."}
            </MessageBanner>
          ) : null}
        </div>

        <div className={`mt-8 grid gap-6 ${managementOpen ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="site-kicker">Subject Directory</p>
                <h2 className="font-display mt-4 text-3xl font-black text-slate-950">Academic unit register</h2>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Enterprise content indexing
              </p>
            </div>

            <div className="site-panel overflow-hidden rounded-[30px]">
              <div className="hidden border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 md:grid md:grid-cols-[56px_minmax(0,1.3fr)_minmax(0,0.9fr)_auto] md:gap-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">No</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Subject</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Scope</p>
                <p className="text-right text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Actions</p>
              </div>

              {subjectsLoading ? (
                <div className="p-5">
                  <ListSkeleton rows={3} />
                </div>
              ) : subjects.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <SubjectIcon className="h-6 w-6" />
                  </span>
                  <p className="font-display mt-4 text-2xl font-black text-slate-950">No subjects yet</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Create the first subject to begin structuring this course.
                  </p>
                </div>
              ) : (
                subjects.map((subject, index) => (
                  <article
                    key={subject._id}
                    className="border-b border-slate-200/70 px-4 py-4 last:border-b-0 md:px-5"
                  >
                    <div className="grid gap-3 md:grid-cols-[56px_minmax(0,1.3fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-4">
                      <div className="flex items-center gap-3 md:gap-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 md:ml-2">
                          <SubjectIcon className="h-5 w-5" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Subject</p>
                        <h3 className="mt-1 truncate text-lg font-black text-slate-950">{subject.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">ID: {subject._id}</p>
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        Open this subject to manage chapter sequencing and lecture-level structure.
                      </p>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Link href={`/subjects/${subject._id}`} className="site-button-primary px-4 py-2 text-xs">
                          Open Subject
                        </Link>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditSubject(subject)}
                              className="site-button-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(subject)}
                              disabled={deletingSubject}
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
              <p className="site-kicker">{editingSubjectId ? "Update Subject" : "Create Subject"}</p>
              <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                {editingSubjectId ? "Edit subject metadata" : "Register new subject"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Keep subject titles clear and academic. This is the root record for chapter and video hierarchy.
              </p>

              <form
                onSubmit={editingSubjectId ? handleUpdateSubject : handleCreateSubject}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Subject Title
                  </label>
                  <input
                    required
                    value={editingSubjectId ? editingSubjectTitle : subjectForm.title}
                    onChange={(event) =>
                      editingSubjectId
                        ? setEditingSubjectTitle(event.target.value)
                        : setSubjectForm({ title: event.target.value })
                    }
                    placeholder="Physics"
                    className={fieldClass()}
                  />
                </div>

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
                        ? "Saving..."
                        : "Save Subject"
                      : creatingSubject
                      ? "Creating..."
                      : "Create Subject"}
                  </button>
                  <button
                    type="button"
                    onClick={closeManagementPanel}
                    className="site-button-secondary"
                  >
                    Close
                  </button>
                </div>
              </form>
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  );
}
