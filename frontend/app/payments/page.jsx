"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { ListSkeleton, InlineLoader } from "@/components/loaders/AppLoader";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import {
  useGenerateMonthlyDuesMutation,
  useGetBatchPaymentsQuery,
  useGetGlobalPaymentsQuery,
  useGetMyPaymentsQuery,
  useMarkPaymentOfflinePaidMutation,
  useMarkPaymentOnlinePaidMutation,
} from "@/lib/features/payment/paymentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";

function StudentPayments() {
  const { data, isLoading } = useGetMyPaymentsQuery();
  const [markPaymentOnlinePaid, { isLoading: paying }] = useMarkPaymentOnlinePaidMutation();
  const [error, setError] = useState("");

  const payments = data?.data || [];
  const summary = data?.summary || { totalDue: 0, totalPaid: 0, dueCount: 0 };

  const handlePay = async (paymentId) => {
    setError("");
    try {
      const nonce = Date.now();
      await markPaymentOnlinePaid({
        paymentId,
        bkashPaymentId: `sandbox-pay-${nonce}`,
        bkashTransactionId: `sandbox-txn-${nonce}`,
        merchantInvoiceNumber: `INV-${nonce}`,
      }).unwrap();
    } catch (payError) {
      setError(payError?.data?.message || "Payment update failed.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Due Amount</p>
          <p className="text-2xl font-bold text-rose-600">{summary.totalDue}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Paid Amount</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.totalPaid}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Due Months</p>
          <p className="text-2xl font-bold text-slate-900">{summary.dueCount}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : payments.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No payment records yet.
        </p>
      ) : (
        payments.map((payment) => (
          <article key={payment._id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900">
                {payment.batch?.name} | {payment.billingMonth}/{payment.billingYear}
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                {payment.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Amount: {payment.amount} {payment.currency || "BDT"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Due: {new Date(payment.dueDate).toLocaleDateString()}
            </p>

            {payment.status === "due" ? (
              <button
                type="button"
                disabled={paying}
                onClick={() => handlePay(payment._id)}
                className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                {paying ? "Processing..." : "Pay Online (Sandbox)"}
              </button>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}

function StaffAdminPayments({ role }) {
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [dueYear, setDueYear] = useState(new Date().getFullYear());
  const [dueMonth, setDueMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState("");

  const { data: batchesData } = useListBatchesQuery();
  const { data: batchPaymentsData, isLoading: batchPaymentsLoading } = useGetBatchPaymentsQuery(
    { batchId: selectedBatchId },
    { skip: !selectedBatchId }
  );
  const { data: globalData, isLoading: globalLoading } = useGetGlobalPaymentsQuery(undefined, {
    skip: !isAdmin(role),
  });

  const [markPaymentOfflinePaid, { isLoading: markingOffline }] = useMarkPaymentOfflinePaidMutation();
  const [generateMonthlyDues, { isLoading: generatingDues }] = useGenerateMonthlyDuesMutation();

  const batches = batchesData?.data || [];
  const batchPayments = batchPaymentsData?.data || [];

  const globalDueSummary = useMemo(() => {
    const list = globalData?.data || [];
    return list.filter((item) => item.status === "due").length;
  }, [globalData]);

  const handleOfflineMark = async (paymentId) => {
    setError("");
    try {
      await markPaymentOfflinePaid({
        paymentId,
        note: "Marked by staff via dashboard",
      }).unwrap();
    } catch (markError) {
      setError(markError?.data?.message || "Failed to mark as paid offline.");
    }
  };

  const handleGenerateDues = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await generateMonthlyDues({
        billingYear: Number(dueYear),
        billingMonth: Number(dueMonth),
        batchId: selectedBatchId || undefined,
      }).unwrap();
    } catch (generateError) {
      setError(generateError?.data?.message || "Failed to generate dues.");
    }
  };

  return (
    <div className="space-y-5">
      {isAdmin(role) ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-900">Global Finance Snapshot</h3>
          <p className="mt-1 text-sm text-slate-600">
            Total global records: {globalLoading ? <InlineLoader label="Loading..." /> : globalData?.count || 0}
          </p>
          <p className="text-sm text-slate-600">
            Global due records: {globalLoading ? <InlineLoader label="Loading..." /> : globalDueSummary}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Course Payment Review</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>

          {isAdmin(role) ? (
            <>
              <input
                type="number"
                min="2000"
                max="2100"
                value={dueYear}
                onChange={(event) => setDueYear(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                max="12"
                value={dueMonth}
                onChange={(event) => setDueMonth(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </>
          ) : null}
        </div>

        {isAdmin(role) ? (
          <form onSubmit={handleGenerateDues} className="mt-3">
            <button
              type="submit"
              disabled={generatingDues}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              {generatingDues ? "Generating..." : "Generate Monthly Dues"}
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="space-y-3">
        {batchPaymentsLoading ? (
          <ListSkeleton rows={3} />
        ) : selectedBatchId && batchPayments.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No payment records for selected batch.
          </p>
        ) : (
          batchPayments.map((payment) => (
            <article key={payment._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900">
                  {payment.student?.fullName || "Student"} | {payment.billingMonth}/{payment.billingYear}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                  {payment.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Amount: {payment.amount} {payment.currency || "BDT"}
              </p>
              {payment.status === "due" ? (
                <button
                  type="button"
                  disabled={markingOffline}
                  onClick={() => handleOfflineMark(payment._id)}
                  className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  {markingOffline ? "Updating..." : "Mark Paid Offline"}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const role = useSelector(selectCurrentUserRole);

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Payments</p>
            <h1 className="text-2xl font-extrabold text-slate-900">Payment Dashboard</h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        {isStudent(role) ? <StudentPayments /> : <StaffAdminPayments role={role} />}
      </section>
    </RequireAuth>
  );
}
