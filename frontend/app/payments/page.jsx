"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import PageHero from "@/components/layouts/PageHero";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { InlineLoader, ListSkeleton } from "@/components/loaders/AppLoader";
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
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

function formatAmount(value, currency = "BDT") {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${currency}`;
}

function StatusPill({ status }) {
  const className =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : status === "paid_offline"
      ? "bg-cyan-50 text-cyan-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${className}`}>
      {status}
    </span>
  );
}

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
      setError(normalizeApiError(payError, "Payment update failed."));
    }
  };

  return (
    <div>
      <div className="site-grid md:grid-cols-3">
        <div className="site-stat-tile">
          <p className="site-stat-label">Due Amount</p>
          <p className="site-stat-value">{formatAmount(summary.totalDue)}</p>
        </div>
        <div className="site-stat-tile">
          <p className="site-stat-label">Paid Amount</p>
          <p className="site-stat-value">{formatAmount(summary.totalPaid)}</p>
        </div>
        <div className="site-stat-tile">
          <p className="site-stat-label">Due Months</p>
          <p className="site-stat-value">{summary.dueCount}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : payments.length === 0 ? (
          <div className="site-panel rounded-[30px] p-5 text-sm text-slate-600">
            No payment records yet.
          </div>
        ) : (
          payments.map((payment) => (
            <article key={payment._id} className="site-panel rounded-[30px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {payment.batch?.name} | {payment.billingMonth}/{payment.billingYear}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Amount: {formatAmount(payment.amount, payment.currency || "BDT")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusPill status={payment.status} />
              </div>

              {payment.status === "due" ? (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => handlePay(payment._id)}
                  className="site-button-primary mt-5 px-5 py-3 text-xs"
                >
                  {paying ? "Processing..." : "Pay Online (Sandbox)"}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
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
  const globalDueSummary = useMemo(
    () => (globalData?.data || []).filter((item) => item.status === "due").length,
    [globalData]
  );

  const handleOfflineMark = async (paymentId) => {
    setError("");
    try {
      await markPaymentOfflinePaid({
        paymentId,
        note: "Marked by staff via dashboard",
      }).unwrap();
    } catch (markError) {
      setError(normalizeApiError(markError, "Failed to mark as paid offline."));
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
      setError(normalizeApiError(generateError, "Failed to generate dues."));
    }
  };

  return (
    <div>
      {isAdmin(role) ? (
        <div className="site-grid md:grid-cols-2">
          <div className="site-stat-tile">
            <p className="site-stat-label">Total Global Records</p>
            <div className="mt-3 min-h-[44px]">
              {globalLoading ? (
                <InlineLoader label="Loading..." />
              ) : (
                <p className="site-stat-value mt-0">{globalData?.count || 0}</p>
              )}
            </div>
          </div>
          <div className="site-stat-tile">
            <p className="site-stat-label">Global Due Records</p>
            <div className="mt-3 min-h-[44px]">
              {globalLoading ? (
                <InlineLoader label="Loading..." />
              ) : (
                <p className="site-stat-value mt-0">{globalDueSummary}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="site-panel mt-6 rounded-[30px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Course Payment Review
            </p>
            <h3 className="font-display mt-2 text-2xl font-black text-slate-950">
              Staff payment operations
            </h3>
          </div>
        </div>

        <div className={`mt-5 grid gap-3 ${isAdmin(role) ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
          <select
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
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
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
              <input
                type="number"
                min="1"
                max="12"
                value={dueMonth}
                onChange={(event) => setDueMonth(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </>
          ) : null}
        </div>

        {isAdmin(role) ? (
          <form onSubmit={handleGenerateDues} className="mt-5">
            <button
              type="submit"
              disabled={generatingDues}
              className="site-button-primary px-5 py-3 text-xs"
            >
              {generatingDues ? "Generating..." : "Generate Monthly Dues"}
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {batchPaymentsLoading ? (
          <ListSkeleton rows={3} />
        ) : selectedBatchId && batchPayments.length === 0 ? (
          <div className="site-panel rounded-[30px] p-5 text-sm text-slate-600">
            No payment records for selected batch.
          </div>
        ) : (
          batchPayments.map((payment) => (
            <article key={payment._id} className="site-panel rounded-[30px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {payment.student?.fullName || "Student"} | {payment.billingMonth}/{payment.billingYear}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Amount: {formatAmount(payment.amount, payment.currency || "BDT")}
                  </p>
                </div>
                <StatusPill status={payment.status} />
              </div>

              {payment.status === "due" ? (
                <button
                  type="button"
                  disabled={markingOffline}
                  onClick={() => handleOfflineMark(payment._id)}
                  className="site-button-primary mt-5 px-5 py-3 text-xs"
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
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Financial Desk"
          title="Payment tracking and verification."
          description="Students can review dues and sandbox payment actions. Staff and administrators can monitor course-level records and mark offline collections."
          actions={role ? <RoleBadge role={role} /> : null}
          aside={
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                Workflow
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Monthly dues can be generated by admin.</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Students can simulate online payment via sandbox.</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Staff can confirm offline payment status manually.</div>
              </div>
            </div>
          }
        />

        <div className="mt-6">{isStudent(role) ? <StudentPayments /> : <StaffAdminPayments role={role} />}</div>
      </section>
    </RequireAuth>
  );
}
