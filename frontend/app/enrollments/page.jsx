"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { CardLoader } from "@/components/loaders/AppLoader";
import {
  useGetEnrollmentRequestsForReviewQuery,
  useGetMyEnrollmentRequestsQuery,
  useReviewEnrollmentRequestMutation,
} from "@/lib/features/enrollment/enrollmentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isStudent } from "@/lib/utils/roleUtils";

export default function EnrollmentsPage() {
  const role = useSelector(selectCurrentUserRole);
  const isStudentRole = isStudent(role);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");

  const { data: myData, isLoading: myLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !isStudentRole,
  });

  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: statusFilter },
    { skip: isStudentRole }
  );

  const [reviewEnrollmentRequest, { isLoading: reviewing }] = useReviewEnrollmentRequestMutation();

  const handleReview = async (enrollmentId, nextStatus) => {
    setError("");

    try {
      await reviewEnrollmentRequest({
        enrollmentId,
        status: nextStatus,
        rejectionReason:
          nextStatus === "rejected"
            ? window.prompt("Rejection reason (optional):") || "Not provided"
            : undefined,
      }).unwrap();
    } catch (reviewError) {
      setError(reviewError?.data?.message || "Failed to update enrollment status.");
    }
  };

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Enrollments</p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {isStudentRole ? "My Enrollment Requests" : "Enrollment Review"}
            </h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {isStudentRole ? (
          <div className="space-y-3">
            {myLoading ? (
              <CardLoader label="Loading your requests..." />
            ) : (myData?.data || []).length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                No enrollment requests found.
              </p>
            ) : (
              (myData?.data || []).map((item) => (
                <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{item.batch?.name || "Course"}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Facebook ID: {item.applicantFacebookId}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Submitted: {new Date(item.createdAt).toLocaleString()}
                  </p>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
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
              <CardLoader label="Loading enrollment queue..." />
            ) : (reviewData?.data || []).length === 0 ? (
              <p className="text-sm text-slate-600">No requests found for this filter.</p>
            ) : (
              <div className="space-y-3">
                {(reviewData?.data || []).map((item) => (
                  <article key={item._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{item.student?.fullName || item.applicantName}</h3>
                        <p className="text-sm text-slate-600">
                          Course: {item.batch?.name} | FB: {item.applicantFacebookId}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                        {item.status}
                      </span>
                    </div>

                    {item.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={reviewing}
                          onClick={() => handleReview(item._id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={reviewing}
                          onClick={() => handleReview(item._id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </RequireAuth>
  );
}
