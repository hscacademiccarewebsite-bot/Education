"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import PageHero from "@/components/layouts/PageHero";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { InlineLoader, ListSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingSelect } from "@/components/forms/FloatingField";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import {
  useGenerateMonthlyDuesMutation,
  useGetBatchPaymentsQuery,
  useGetGlobalPaymentsQuery,
  useGetMyPaymentsQuery,
  useMarkPaymentOfflinePaidMutation,
  useCreateBkashPaymentMutation,
} from "@/lib/features/payment/paymentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function formatAmount(value, currency = "BDT", language = "en") {
  const locale = language === "bn" ? "bn-BD" : "en-US";
  return `${new Intl.NumberFormat(locale).format(Number(value || 0))} ${currency}`;
}

function StatusPill({ status, t }) {
  const className =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : status === "paid_offline"
      ? "bg-cyan-50 text-cyan-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${className}`}>
      {t(`paymentsPage.status.${status}`, status)}
    </span>
  );
}

function StudentPayments({ t, language }) {
  const { data, isLoading } = useGetMyPaymentsQuery();
  const [createBkashPayment, { isLoading: paying }] = useCreateBkashPaymentMutation();
  const [error, setError] = useState("");
  const { showError, popupNode } = useActionPopup();

  const payments = data?.data || [];
  const summary = data?.summary || { totalDue: 0, totalPaid: 0, dueCount: 0 };

  const handlePay = async (paymentId) => {
    setError("");
    try {
      const response = await createBkashPayment({ paymentId }).unwrap();
      if (response?.bkashURL) {
        window.location.href = response.bkashURL;
      } else {
        throw new Error("bKash redirect URL not provided by the server.");
      }
    } catch (payError) {
      const resolvedError = normalizeApiError(payError, t("paymentsPage.messages.paymentUpdateFailed", "Failed to initialize bKash payment."));
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <div>
      <div className="site-grid md:grid-cols-3">
        <div className="site-stat-tile">
          <p className="site-stat-label">{t("paymentsPage.studentStats.dueAmount")}</p>
          <p className="site-stat-value">{formatAmount(summary.totalDue, "BDT", language)}</p>
        </div>
        <div className="site-stat-tile">
          <p className="site-stat-label">{t("paymentsPage.studentStats.paidAmount")}</p>
          <p className="site-stat-value">{formatAmount(summary.totalPaid, "BDT", language)}</p>
        </div>
        <div className="site-stat-tile">
          <p className="site-stat-label">{t("paymentsPage.studentStats.dueMonths")}</p>
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
            {t("paymentsPage.noPaymentRecords")}
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
                    {t("paymentsPage.amount")}: {formatAmount(payment.amount, payment.currency || "BDT", language)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("paymentsPage.due")}: {new Date(payment.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                  </p>
                </div>
                <StatusPill status={payment.status} t={t} />
              </div>

              {payment.status === "due" ? (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => handlePay(payment._id)}
                  className="site-button-primary mt-5"
                >
                  {paying ? t("paymentsPage.processing") : t("paymentsPage.payOnlineSandbox")}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
      {popupNode}
    </div>
  );
}

function StaffAdminPayments({ role, t, language }) {
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
  const { showSuccess, showError, popupNode } = useActionPopup();

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
        note: t("paymentsPage.markedByStaffNote"),
      }).unwrap();
      showSuccess(t("paymentsPage.messages.markedOffline"));
    } catch (markError) {
      const resolvedError = normalizeApiError(markError, t("paymentsPage.messages.markOfflineFailed"));
      setError(resolvedError);
      showError(resolvedError);
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
      showSuccess(t("paymentsPage.messages.duesGenerated"));
    } catch (generateError) {
      const resolvedError = normalizeApiError(generateError, t("paymentsPage.messages.generateDuesFailed"));
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <div>
      {isAdmin(role) ? (
        <div className="site-grid md:grid-cols-2">
          <div className="site-stat-tile">
            <p className="site-stat-label">{t("paymentsPage.adminStats.totalGlobalRecords")}</p>
            <div className="mt-3 min-h-[44px]">
              {globalLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="site-stat-value mt-0">{globalData?.count || 0}</p>
              )}
            </div>
          </div>
          <div className="site-stat-tile">
            <p className="site-stat-label">{t("paymentsPage.adminStats.globalDueRecords")}</p>
            <div className="mt-3 min-h-[44px]">
              {globalLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
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
              {t("paymentsPage.coursePaymentReview")}
            </p>
            <h3 className="font-display mt-2 text-2xl font-black text-slate-950">
              {t("paymentsPage.staffPaymentOperations")}
            </h3>
          </div>
        </div>

        <div className={`mt-5 grid gap-3 ${isAdmin(role) ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
          <FloatingSelect
            label={t("paymentsPage.courseBatch")}
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
          >
            <option value="">{t("paymentsPage.selectBatch")}</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </FloatingSelect>

          {isAdmin(role) ? (
            <>
              <FloatingInput
                type="number"
                min="2000"
                max="2100"
                label={t("paymentsPage.billingYear")}
                value={dueYear}
                onChange={(event) => setDueYear(event.target.value)}
              />
              <FloatingInput
                type="number"
                min="1"
                max="12"
                label={t("paymentsPage.billingMonth")}
                value={dueMonth}
                onChange={(event) => setDueMonth(event.target.value)}
              />
            </>
          ) : null}
        </div>

        {isAdmin(role) ? (
          <form onSubmit={handleGenerateDues} className="mt-5">
            <button
              type="submit"
              disabled={generatingDues}
              className="site-button-primary"
            >
              {generatingDues ? t("paymentsPage.generating") : t("paymentsPage.generateMonthlyDues")}
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
            {t("paymentsPage.noBatchRecords")}
          </div>
        ) : (
          batchPayments.map((payment) => (
            <article key={payment._id} className="site-panel rounded-[30px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {payment.student?.fullName || t("paymentsPage.studentFallback")} | {payment.billingMonth}/{payment.billingYear}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("paymentsPage.amount")}: {formatAmount(payment.amount, payment.currency || "BDT", language)}
                  </p>
                </div>
                <StatusPill status={payment.status} t={t} />
              </div>

              {payment.status === "due" ? (
                <button
                  type="button"
                  disabled={markingOffline}
                  onClick={() => handleOfflineMark(payment._id)}
                  className="site-button-primary mt-5"
                >
                  {markingOffline ? t("paymentsPage.updating") : t("paymentsPage.markPaidOffline")}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
      {popupNode}
    </div>
  );
}

export default function PaymentsPage() {
  const role = useSelector(selectCurrentUserRole);
  const { t, language } = useSiteLanguage();

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow={t("paymentsPage.hero.eyebrow")}
          title={t("paymentsPage.hero.title")}
          description={t("paymentsPage.hero.description")}
          actions={role ? <RoleBadge role={role} /> : null}
          aside={
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                {t("paymentsPage.hero.workflow")}
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">{t("paymentsPage.hero.workflowItems.dues")}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">{t("paymentsPage.hero.workflowItems.sandbox")}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">{t("paymentsPage.hero.workflowItems.offline")}</div>
              </div>
            </div>
          }
        />

        <div className="mt-6">{isStudent(role) ? <StudentPayments t={t} language={language} /> : <StaffAdminPayments role={role} t={t} language={language} />}</div>
      </section>
    </RequireAuth>
  );
}
