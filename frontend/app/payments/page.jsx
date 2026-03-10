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
  const normalized = status || "due";
  const palette = {
    due: {
      chip: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    paid_online: {
      chip: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
    paid_offline: {
      chip: "bg-sky-50 text-sky-700",
      dot: "bg-sky-500",
    },
    waived: {
      chip: "bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const style = palette[normalized] || palette.due;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {t(`paymentsPage.status.${normalized}`, normalized)}
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [dueYear, setDueYear] = useState(new Date().getFullYear());
  const [dueMonth, setDueMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState("");

  const { data: batchesData } = useListBatchesQuery();
  const { data: batchPaymentsData, isLoading: batchPaymentsLoading } = useGetBatchPaymentsQuery(
    {
      batchId: selectedBatchId,
      status: filterStatus !== "all" ? filterStatus : undefined,
      billingYear: filterYear,
      billingMonth: filterMonth,
    },
    { skip: !selectedBatchId }
  );
  const { data: globalSummaryData, isLoading: globalSummaryLoading } = useGetGlobalPaymentsQuery(
    undefined,
    {
      skip: !isAdmin(role),
    }
  );
  const showGlobalLedger = isAdmin(role) && !selectedBatchId;
  const { data: globalLedgerData, isLoading: globalLedgerLoading } = useGetGlobalPaymentsQuery(
    showGlobalLedger
      ? {
          status: filterStatus !== "all" ? filterStatus : undefined,
          billingYear: filterYear,
          billingMonth: filterMonth,
        }
      : undefined,
    {
      skip: !showGlobalLedger,
    }
  );

  const [markPaymentOfflinePaid, { isLoading: markingOffline }] = useMarkPaymentOfflinePaidMutation();
  const [generateMonthlyDues, { isLoading: generatingDues }] = useGenerateMonthlyDuesMutation();
  const { showSuccess, showError, popupNode } = useActionPopup();

  const batches = batchesData?.data || [];
  const batchPayments = batchPaymentsData?.data || [];
  const globalPayments = globalSummaryData?.data || [];
  const ledgerPayments = showGlobalLedger ? globalLedgerData?.data || [] : batchPayments;
  const ledgerLoading = showGlobalLedger ? globalLedgerLoading : batchPaymentsLoading;
  const selectedBatch = batches.find((batch) => batch._id === selectedBatchId);
  const globalDueSummary = useMemo(
    () => globalPayments.filter((item) => item.status === "due").length,
    [globalPayments]
  );
  const globalPaidOfflineSummary = useMemo(
    () => globalPayments.filter((item) => item.status === "paid_offline").length,
    [globalPayments]
  );
  const globalPaidOnlineSummary = useMemo(
    () => globalPayments.filter((item) => item.status === "paid_online").length,
    [globalPayments]
  );
  const globalPaidTotalSummary = globalPaidOfflineSummary + globalPaidOnlineSummary;
  const ledgerSummary = useMemo(() => {
    return ledgerPayments.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "due") acc.due += 1;
        if (item.status === "paid_online") acc.paidOnline += 1;
        if (item.status === "paid_offline") acc.paidOffline += 1;
        if (item.status === "waived") acc.waived += 1;
        return acc;
      },
      { total: 0, due: 0, paidOnline: 0, paidOffline: 0, waived: 0 }
    );
  }, [ledgerPayments]);

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

  const formatDate = (dateValue) => {
    if (!dateValue) return t("paymentsPage.notAvailable", "N/A");
    return new Date(dateValue).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US");
  };

  const methodLabel = (method) => {
    if (method === "bkash") return t("paymentsPage.methodBkash", "bKash");
    if (method === "offline") return t("paymentsPage.methodOffline", "Offline");
    if (method === "manual_adjustment") return t("paymentsPage.methodAdjusted", "Manual Adjustment");
    return t("paymentsPage.methodPending", "Pending");
  };

  return (
    <div className="space-y-8">
      {isAdmin(role) ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="site-stat-tile">
            <p className="site-stat-label">{t("paymentsPage.adminStats.totalGlobalRecords")}</p>
            <div className="mt-3 min-h-[44px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="site-stat-value mt-0">{globalSummaryData?.count || 0}</p>
              )}
            </div>
          </div>
          <div className="site-stat-tile">
            <p className="site-stat-label">{t("paymentsPage.adminStats.globalDueRecords")}</p>
            <div className="mt-3 min-h-[44px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="site-stat-value mt-0">{globalDueSummary}</p>
              )}
            </div>
          </div>
          <div className="site-stat-tile">
            <p className="site-stat-label">{t("paymentsPage.adminStats.globalPaidRecords")}</p>
            <div className="mt-3 min-h-[44px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="site-stat-value mt-0">{globalPaidTotalSummary}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <div className="site-panel rounded-[30px] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t("paymentsPage.ledgerKicker", "Ledger Snapshot")}
                </p>
                <h3 className="font-display mt-3 text-2xl font-black text-slate-950">
                  {t("paymentsPage.ledgerTitle", "Payment Ledger")}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {showGlobalLedger
                    ? t("paymentsPage.ledgerGlobalHint", "Viewing all batches combined.")
                    : selectedBatchId
                    ? t("paymentsPage.ledgerBatchHint", "Viewing records for the selected batch.")
                    : t("paymentsPage.ledgerSelectHint", "Select a batch to begin reviewing payments.")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {t("paymentsPage.ledgerTotal", "Records")}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">{ledgerSummary.total}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
                  {t("paymentsPage.status.due", "Due")}
                </p>
                <p className="mt-2 text-2xl font-black text-amber-700">{ledgerSummary.due}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  {t("paymentsPage.status.paid_online", "Paid Online")}
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-700">{ledgerSummary.paidOnline}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-600">
                  {t("paymentsPage.status.paid_offline", "Paid Offline")}
                </p>
                <p className="mt-2 text-2xl font-black text-sky-700">{ledgerSummary.paidOffline}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {t("paymentsPage.status.waived", "Waived")}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-700">{ledgerSummary.waived}</p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            {ledgerLoading ? (
              <ListSkeleton rows={3} />
            ) : !selectedBatchId && !showGlobalLedger ? (
              <div className="site-panel rounded-[30px] p-5 text-sm text-slate-600">
                {t("paymentsPage.selectBatchPrompt", "Select a batch to view payment records.")}
              </div>
            ) : ledgerPayments.length === 0 ? (
              <div className="site-panel rounded-[30px] p-5 text-sm text-slate-600">
                {t("paymentsPage.noBatchRecords")}
              </div>
            ) : (
              ledgerPayments.map((payment) => {
                const batchName =
                  payment.batch?.name || selectedBatch?.name || t("paymentsPage.batchFallback", "Batch");
                const studentName =
                  payment.student?.fullName || t("paymentsPage.studentFallback", "Student");

                return (
                  <article
                    key={payment._id}
                    className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {batchName} - {payment.billingMonth}/{payment.billingYear}
                        </p>
                        <h4 className="font-display mt-2 text-xl font-black text-slate-950">
                          {studentName}
                        </h4>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-slate-500">{t("paymentsPage.amount")}:</span>{" "}
                            {formatAmount(payment.amount, payment.currency || "BDT", language)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">{t("paymentsPage.due")}:</span>{" "}
                            {formatDate(payment.dueDate)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              {t("paymentsPage.method", "Method")}:
                            </span>{" "}
                            {methodLabel(payment.paymentMethod)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">
                              {t("paymentsPage.paidAt", "Paid")}:
                            </span>{" "}
                            {formatDate(payment.paidAt)}
                          </div>
                        </div>
                        {payment.note ? (
                          <p className="mt-3 text-xs text-slate-500">
                            {t("paymentsPage.note", "Note")}: {payment.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill status={payment.status} t={t} />
                        {payment.status === "due" ? (
                          <button
                            type="button"
                            disabled={markingOffline}
                            onClick={() => handleOfflineMark(payment._id)}
                            className="site-button-primary"
                          >
                            {markingOffline ? t("paymentsPage.updating") : t("paymentsPage.markPaidOffline")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="site-panel rounded-[30px] p-5 md:p-6">
            <h3 className="font-display text-xl font-black text-slate-950">
              {t("paymentsPage.filtersTitle", "Ledger Filters")}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {t(
                "paymentsPage.filtersSubtitle",
                "Scope the ledger by batch, month, and payment status."
              )}
            </p>

            <div className="mt-5 grid gap-3">
              <FloatingSelect
                label={t("paymentsPage.courseBatch")}
                value={selectedBatchId}
                onChange={(event) => setSelectedBatchId(event.target.value)}
              >
                <option value="">
                  {isAdmin(role)
                    ? t("paymentsPage.selectGlobal", "All batches (global)")
                    : t("paymentsPage.selectBatch")}
                </option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </FloatingSelect>

              <FloatingSelect
                label={t("paymentsPage.statusFilter", "Status")}
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="all">{t("paymentsPage.statusAll", "All statuses")}</option>
                <option value="due">{t("paymentsPage.status.due", "Due")}</option>
                <option value="paid_online">{t("paymentsPage.status.paid_online", "Paid Online")}</option>
                <option value="paid_offline">{t("paymentsPage.status.paid_offline", "Paid Offline")}</option>
                <option value="waived">{t("paymentsPage.status.waived", "Waived")}</option>
              </FloatingSelect>

              <div className="grid gap-3 sm:grid-cols-2">
                <FloatingInput
                  type="number"
                  min="2000"
                  max="2100"
                  label={t("paymentsPage.billingYear")}
                  value={filterYear}
                  onChange={(event) => setFilterYear(event.target.value)}
                />
                <FloatingInput
                  type="number"
                  min="1"
                  max="12"
                  label={t("paymentsPage.billingMonth")}
                  value={filterMonth}
                  onChange={(event) => setFilterMonth(event.target.value)}
                />
              </div>
            </div>
          </div>

          {isAdmin(role) ? (
            <div className="site-panel rounded-[30px] p-5 md:p-6">
              <h3 className="font-display text-xl font-black text-slate-950">
                {t("paymentsPage.generateTitle", "Generate Monthly Dues")}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {t(
                  "paymentsPage.generateSubtitle",
                  "Creates due records only for students approved before the selected month."
                )}
              </p>
              <form onSubmit={handleGenerateDues} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
                <button type="submit" disabled={generatingDues} className="site-button-primary">
                  {generatingDues ? t("paymentsPage.generating") : t("paymentsPage.generateMonthlyDues")}
                </button>
              </form>
            </div>
          ) : null}

          <div className="site-panel-muted rounded-[30px] p-5 md:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
              {t("paymentsPage.cycleKicker", "Billing Rule")}
            </p>
            <h4 className="font-display mt-3 text-lg font-black text-slate-900">
              {t("paymentsPage.cycleTitle", "Enrollment Month Is Free")}
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              {t(
                "paymentsPage.cycleDescription",
                "If a student is approved on January 4, the first due date is February 1. The enrollment month is never billed."
              )}
            </p>
          </div>
        </div>
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
        />

        <div className="mt-6">{isStudent(role) ? <StudentPayments t={t} language={language} /> : <StaffAdminPayments role={role} t={t} language={language} />}</div>
      </section>
    </RequireAuth>
  );
}
