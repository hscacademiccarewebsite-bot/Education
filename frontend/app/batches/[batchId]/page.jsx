"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { CardLoader } from "@/components/loaders/AppLoader";
import { SubjectIcon } from "@/components/icons/PortalIcons";
import { useGetBatchByIdQuery } from "@/lib/features/batch/batchApi";
import {
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useListSubjectsQuery,
  useUpdateSubjectMutation,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { canManageContent } from "@/lib/utils/roleUtils";

const initialSubjectForm = {
  title: "",
};

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
}

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params?.batchId;

  const role = useSelector(selectCurrentUserRole);
  const canManage = canManageContent(role);

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
      setSubjectError(createError?.data?.message || "Failed to create subject.");
    }
  };

  const openEditSubject = (subject) => {
    setEditingSubjectId(subject._id);
    setEditingSubjectTitle(subject.title || "");
    setSubjectMessage("");
    setSubjectError("");
  };

  const closeEditSubject = () => {
    setEditingSubjectId("");
    setEditingSubjectTitle("");
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
      closeEditSubject();
    } catch (updateError) {
      setSubjectError(updateError?.data?.message || "Failed to update subject.");
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
        closeEditSubject();
      }
    } catch (deleteError) {
      setSubjectError(deleteError?.data?.message || "Failed to delete subject.");
    }
  };

  if (batchLoading) {
    return (
      <section className="container-page py-10">
        <CardLoader label="Loading course workspace..." />
      </section>
    );
  }

  if (!batch) {
    return (
      <section className="container-page py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Course not found or access denied.
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/courses"
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
        >
          Back to Courses
        </Link>
        {batch.facebookGroupUrl ? (
          <a
            href={batch.facebookGroupUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100"
          >
            Open Private Facebook Group
          </a>
        ) : null}
      </div>

      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <div className="relative">
          <img
            src={
              batch?.banner?.url ||
              batch?.thumbnail?.url ||
              "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=70"
            }
            alt={batch.name}
            className="h-52 w-full object-cover md:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Course Space</p>
            <h1 className="mt-2 text-2xl font-black text-white md:text-4xl [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              {batch.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              Subjects
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Select a subject to open chapter cards
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setShowSubjectForm((prev) => !prev);
                setSubjectMessage("");
                setSubjectError("");
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700"
            >
              {showSubjectForm ? "Close Form" : "Create Subject"}
            </button>
          ) : null}
        </div>

        {subjectMessage ? (
          <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            {subjectMessage}
          </p>
        ) : null}
        {subjectError ? (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {subjectError}
          </p>
        ) : null}

        {canManage && showSubjectForm ? (
          <form
            onSubmit={handleCreateSubject}
            className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50 p-4"
          >
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Subject Title
            </label>
            <input
              required
              value={subjectForm.title}
              onChange={(event) => setSubjectForm({ title: event.target.value })}
              placeholder="Physics"
              className={fieldClass()}
            />

            <button
              type="submit"
              disabled={creatingSubject}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {creatingSubject ? "Creating..." : "Create Subject"}
            </button>
          </form>
        ) : null}

        {subjectsLoading ? (
          <CardLoader label="Loading subjects..." />
        ) : subjectsIsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {subjectsError?.data?.message ||
              "You do not have access to this course content yet. Enrollment approval is required for students."}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No subjects yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject, index) => (
              <article
                key={subject._id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />

                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700">
                  <SubjectIcon className="h-5 w-5" />
                </span>

                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Subject {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                  {subject.title}
                </h3>

                {editingSubjectId === subject._id && canManage ? (
                  <form onSubmit={handleUpdateSubject} className="mt-4 space-y-2">
                    <input
                      required
                      value={editingSubjectTitle}
                      onChange={(event) => setEditingSubjectTitle(event.target.value)}
                      className={fieldClass()}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={updatingSubject}
                        className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        {updatingSubject ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={closeEditSubject}
                        className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/subjects/${subject._id}`}
                      className="inline-flex rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition group-hover:bg-slate-50"
                    >
                      Open Subject
                    </Link>

                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditSubject(subject)}
                          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-cyan-700 transition hover:bg-cyan-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(subject)}
                          disabled={deletingSubject}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
