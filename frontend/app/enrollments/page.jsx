"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import {
  useCreateEnrollmentRequestMutation,
  useGetEnrollmentRequestsForReviewQuery,
  useGetMyEnrollmentRequestsQuery,
  useReviewEnrollmentRequestMutation,
} from "@/lib/features/enrollment/enrollmentApi";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { selectCurrentUser, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isStudent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

const STATUS_PILL = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
}

function resolveFacebookProfileUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return value;
  }

  const cleanValue = value.replace(/^@/, "");
  return `https://facebook.com/${cleanValue}`;
}

export default function EnrollmentsPage() {
  const searchParams = useSearchParams();
  const preselectedBatchId = searchParams.get("batchId") || "";

  const role = useSelector(selectCurrentUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const isStudentRole = isStudent(role);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    batchId: "",
    applicantName: "",
    applicantFacebookId: "",
    applicantPhone: "",
    note: "",
    applicantPhoto: null,
    facebookGroupJoinRequested: false,
  });

  const { data: myData, isLoading: myLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !isStudentRole,
  });
  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery(undefined, {
    skip: !isStudentRole,
  });
  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: statusFilter },
    { skip: isStudentRole }
  );

  const [createEnrollmentRequest, { isLoading: applying }] = useCreateEnrollmentRequestMutation();
  const [reviewEnrollmentRequest, { isLoading: reviewing }] = useReviewEnrollmentRequestMutation();

  const availableBatches = useMemo(
    () =>
      (coursesData?.data || []).filter(
        (batch) => batch?.status === "active" || batch?.status === "upcoming"
      ),
    [coursesData]
  );

  const myEnrollments = myData?.data || [];
  const enrollmentByBatchId = useMemo(() => {
    const map = new Map();
    myEnrollments.forEach((item) => {
      map.set(String(item.batch?._id || item.batch), item);
    });
    return map;
  }, [myEnrollments]);

  const selectedBatchEnrollment = enrollmentByBatchId.get(String(form.batchId || ""));
  const selectedBatch = availableBatches.find((batch) => String(batch._id) === String(form.batchId));
  const hasSelectedBatchGroupLink = Boolean(selectedBatch?.facebookGroupUrl);

  useEffect(() => {
    if (!isStudentRole || !currentUser) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      applicantName: prev.applicantName || currentUser.fullName || "",
      applicantFacebookId: prev.applicantFacebookId || currentUser.facebookProfileId || "",
      applicantPhone: prev.applicantPhone || currentUser.phone || "",
      applicantPhoto:
        prev.applicantPhoto ||
        (currentUser.profilePhoto?.url
          ? {
              url: currentUser.profilePhoto.url,
              publicId: currentUser.profilePhoto.publicId || "",
            }
          : null),
    }));
  }, [currentUser, isStudentRole]);

  useEffect(() => {
    if (!isStudentRole) {
      return;
    }

    if (preselectedBatchId) {
      setForm((prev) => ({ ...prev, batchId: preselectedBatchId }));
      return;
    }

    if (!form.batchId && availableBatches.length > 0) {
      setForm((prev) => ({ ...prev, batchId: String(availableBatches[0]._id) }));
    }
  }, [availableBatches, form.batchId, isStudentRole, preselectedBatchId]);

  const handleApply = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.batchId) {
      setError("Please select a batch.");
      return;
    }
    if (!form.applicantName.trim()) {
      setError("Applicant name is required.");
      return;
    }
    if (!form.applicantFacebookId.trim()) {
      setError("Facebook ID is required.");
      return;
    }
    if (!form.applicantPhoto?.url) {
      setError("Applicant photo is required.");
      return;
    }
    if (!form.facebookGroupJoinRequested) {
      setError("Please send join request to private Facebook group and confirm checkbox.");
      return;
    }
    if (!hasSelectedBatchGroupLink) {
      setError("This batch does not have a private Facebook group link configured yet.");
      return;
    }
    if (selectedBatchEnrollment?.status === "pending") {
      setError("Your application is already pending for this batch.");
      return;
    }
    if (selectedBatchEnrollment?.status === "approved") {
      setError("You are already approved in this batch.");
      return;
    }

    try {
      const response = await createEnrollmentRequest({
        batchId: form.batchId,
        applicantName: form.applicantName.trim(),
        applicantFacebookId: form.applicantFacebookId.trim(),
        applicantPhone: form.applicantPhone.trim(),
        applicantPhoto: {
          url: form.applicantPhoto.url,
          publicId: form.applicantPhoto.publicId || "",
        },
        note: form.note.trim(),
        facebookGroupJoinRequested: true,
      }).unwrap();

      setMessage(response?.message || "Enrollment request submitted.");
    } catch (applyError) {
      setError(normalizeApiError(applyError));
    }
  };

  const handleReview = async (enrollmentId, nextStatus) => {
    setError("");
    setMessage("");

    try {
      await reviewEnrollmentRequest({
        enrollmentId,
        status: nextStatus,
        rejectionReason:
          nextStatus === "rejected"
            ? window.prompt("Rejection reason (optional):") || "Not provided"
            : undefined,
      }).unwrap();
      setMessage(`Request ${nextStatus}.`);
    } catch (reviewError) {
      setError(normalizeApiError(reviewError));
    }
  };

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Enrollments</p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {isStudentRole ? "Apply for Batch" : "Enrollment Review"}
            </h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        {isStudentRole ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Batch Application Form</h2>
              <p className="mt-1 text-sm text-slate-600">
                Submit your information to apply. Admin/Teacher/Moderator will review your request.
              </p>

              <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleApply}>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Select Batch
                  </label>
                  <select
                    value={form.batchId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, batchId: event.target.value }))
                    }
                    className={fieldClass()}
                  >
                    <option value="">Choose a batch...</option>
                    {availableBatches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name} ({batch.status})
                      </option>
                    ))}
                  </select>
                  {coursesLoading ? <p className="mt-1 text-xs text-slate-500">Loading batches...</p> : null}
                  {selectedBatchEnrollment ? (
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      Existing status for this batch:{" "}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          STATUS_PILL[selectedBatchEnrollment.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {selectedBatchEnrollment.status}
                      </span>
                    </p>
                  ) : null}
                </div>

                {selectedBatch?.facebookGroupUrl ? (
                  <div className="md:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm text-cyan-800">
                    <p className="font-semibold">
                      Step 1: Send join request to private group before applying.
                    </p>
                    <a
                      href={selectedBatch.facebookGroupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-xs font-black uppercase tracking-[0.12em] text-cyan-700 underline"
                    >
                      Open Private Facebook Group
                    </a>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Applicant Name
                  </label>
                  <input
                    required
                    value={form.applicantName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicantName: event.target.value }))
                    }
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Facebook ID
                  </label>
                  <input
                    required
                    value={form.applicantFacebookId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicantFacebookId: event.target.value }))
                    }
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Phone (Optional)
                  </label>
                  <input
                    value={form.applicantPhone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
                    }
                    className={fieldClass()}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Note (Optional)
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                    rows={3}
                    className={fieldClass()}
                  />
                </div>

                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Applicant Photo"
                    folder="hsc-academic/enrollments"
                    asset={form.applicantPhoto}
                    previewAlt="Applicant photo"
                    onChange={(asset) =>
                      setForm((prev) => ({
                        ...prev,
                        applicantPhoto: asset?.url
                          ? { url: asset.url, publicId: asset.publicId || "" }
                          : null,
                      }))
                    }
                  />
                </div>

                <label className="md:col-span-2 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.facebookGroupJoinRequested}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        facebookGroupJoinRequested: event.target.checked,
                      }))
                    }
                  />
                  I have already sent a join request in the private Facebook group.
                </label>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={applying || !form.facebookGroupJoinRequested || !hasSelectedBatchGroupLink}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  >
                    {applying
                      ? "Submitting..."
                      : selectedBatchEnrollment?.status === "rejected"
                      ? "Re-Apply"
                      : "Apply for Batch"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">My Requests</h2>
              <p className="mt-1 text-sm text-slate-600">Track approval status of your applications.</p>

              <div className="mt-4 space-y-3">
                {myLoading ? (
                  <ListSkeleton rows={3} />
                ) : myEnrollments.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No enrollment requests found.
                  </p>
                ) : (
                  myEnrollments.map((item) => (
                    <article key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900">{item.batch?.name || "Batch"}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            FB ID: {item.applicantFacebookId} {item.applicantPhone ? `| Phone: ${item.applicantPhone}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Submitted: {new Date(item.createdAt).toLocaleString()}
                          </p>
                          {item.batch?.facebookGroupUrl ? (
                            <a
                              href={item.batch.facebookGroupUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-xs font-semibold text-cyan-700 underline"
                            >
                              Open batch private group
                            </a>
                          ) : null}
                          {item.status === "rejected" ? (
                            <p className="mt-1 text-xs font-semibold text-rose-700">
                              Reason: {item.rejectionReason || "Not provided"}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            STATUS_PILL[item.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Filter:</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {reviewLoading ? (
              <ListSkeleton rows={3} />
            ) : (reviewData?.data || []).length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No requests found for this filter.
              </p>
            ) : (
              <div className="space-y-3">
                {(reviewData?.data || []).map((item) => {
                  const rawFacebookProfile =
                    item.student?.facebookProfileId || item.applicantFacebookId || "";
                  const facebookProfileUrl = resolveFacebookProfileUrl(rawFacebookProfile);

                  return (
                    <article key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        {item.applicantPhoto?.url ? (
                          <img
                            src={item.applicantPhoto.url}
                            alt={item.applicantName || "Applicant"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200" />
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">
                            {item.applicantName || item.student?.fullName || "Student"}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600">
                            <span className="truncate">{item.batch?.name || "Batch N/A"}</span>
                            <span>|</span>
                            <span>FB:</span>
                            {facebookProfileUrl ? (
                              <a
                                href={facebookProfileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate font-semibold text-cyan-700 underline"
                                title={rawFacebookProfile}
                              >
                                {rawFacebookProfile}
                              </a>
                            ) : (
                              <span className="truncate">{item.applicantFacebookId || "N/A"}</span>
                            )}
                            {item.applicantPhone ? (
                              <>
                                <span>|</span>
                                <span>{item.applicantPhone}</span>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            Group request: {item.facebookGroupJoinRequested ? "Sent" : "Not confirmed"}
                          </p>
                          {item.batch?.facebookGroupUrl ? (
                            <a
                              href={item.batch.facebookGroupUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-xs font-semibold text-cyan-700 underline"
                            >
                              Open private Facebook group
                            </a>
                          ) : (
                            <p className="mt-1 text-xs font-semibold text-amber-700">
                              Group link not configured
                            </p>
                          )}
                          {item.note ? (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">Note: {item.note}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            STATUS_PILL[item.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {item.status === "pending" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={reviewing}
                          onClick={() => handleReview(item._id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={reviewing}
                          onClick={() => handleReview(item._id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : item.status === "rejected" ? (
                      <p className="mt-2 text-xs font-semibold text-rose-700">
                        Reason: {item.rejectionReason || "Not provided"}
                      </p>
                    ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </RequireAuth>
  );
}
