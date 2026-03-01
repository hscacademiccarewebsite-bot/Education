"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { InlineLoader } from "@/components/loaders/AppLoader";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useGetMyPaymentsQuery, useGetGlobalPaymentsQuery } from "@/lib/features/payment/paymentApi";
import { useGetEnrollmentRequestsForReviewQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useListUsersQuery } from "@/lib/features/user/userApi";
import { selectCurrentUser, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStaff, isStudent } from "@/lib/utils/roleUtils";

function StudentOverview() {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useGetMyEnrollmentRequestsQuery();
  const { data: paymentsData, isLoading: paymentsLoading } = useGetMyPaymentsQuery();

  const enrollments = enrollmentsData?.data || [];
  const approved = enrollments.filter((item) => item.status === "approved").length;
  const pending = enrollments.filter((item) => item.status === "pending").length;
  const paymentSummary = paymentsData?.summary || { dueCount: 0, totalDue: 0 };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Approved Courses</p>
        {enrollmentsLoading ? (
          <InlineLoader label="Loading..." className="mt-2 flex" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-slate-900">{approved}</p>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Pending Requests</p>
        {enrollmentsLoading ? (
          <InlineLoader label="Loading..." className="mt-2 flex" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-amber-600">{pending}</p>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Due Amount (BDT)</p>
        {paymentsLoading ? (
          <InlineLoader label="Loading..." className="mt-2 flex" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-rose-600">{paymentSummary.totalDue || 0}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">Due months: {paymentSummary.dueCount || 0}</p>
      </div>
    </div>
  );
}

function StaffOverview() {
  const { data, isLoading } = useGetEnrollmentRequestsForReviewQuery({ status: "pending" });
  const pendingList = data?.data || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-900">Enrollment Review Queue</h3>
      <p className="mt-2 text-sm text-slate-600">
        Pending applications across accessible batches:{" "}
        <span className="font-bold text-slate-900">
          {isLoading ? <InlineLoader label="Loading..." /> : pendingList.length}
        </span>
      </p>
      <Link
        href="/enrollments"
        className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
      >
        Open Enrollment Review
      </Link>
    </div>
  );
}

function AdminOverview() {
  const { data: usersData } = useListUsersQuery();
  const { data: globalPaymentData, isLoading } = useGetGlobalPaymentsQuery();

  const users = usersData?.data || [];
  const payments = globalPaymentData?.data || [];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Total Users</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{users.length}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Global Payments</p>
        {isLoading ? (
          <InlineLoader label="Loading..." className="mt-2 flex" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-slate-900">{payments.length}</p>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Admin Actions</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/users" className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
            Manage Users
          </Link>
          <Link
            href="/payments"
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            Global Finance
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentUserRole);

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 md:text-3xl">Welcome back</h1>
          <div className="mt-3 flex items-center gap-3">
            {currentUser?.fullName ? (
              <p className="text-sm text-slate-600">{currentUser.fullName}</p>
            ) : (
              <InlineLoader label="Loading user..." />
            )}
            {role ? <RoleBadge role={role} /> : null}
          </div>
        </div>

        {isStudent(role) ? <StudentOverview /> : null}
        {isStaff(role) ? <StaffOverview /> : null}
        {isAdmin(role) ? (
          <div className="mt-4">
            <AdminOverview />
          </div>
        ) : null}
      </section>
    </RequireAuth>
  );
}
