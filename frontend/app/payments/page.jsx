"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
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
  useWaivePaymentMutation,
} from "@/lib/features/payment/paymentApi";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

const MONTH_NAMES_EN = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_BN = ["", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

function getMonthName(month, language = "en") {
  const m = Number(month);
  if (m < 1 || m > 12) return String(month);
  return language === "bn" ? MONTH_NAMES_BN[m] : MONTH_NAMES_EN[m];
}

function formatAmount(value, currency = "BDT", language = "en") {
  const locale = language === "bn" ? "bn-BD" : "en-US";
  return `${new Intl.NumberFormat(locale).format(Number(value || 0))} ${currency}`;
}

function StatusPill({ status, t }) {
  const normalized = status || "due";
  const palette = {
    due: { chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    paid_online: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    paid_offline: { chip: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
    waived: { chip: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  };
  const style = palette[normalized] || palette.due;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${style.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {t(`paymentsPage.status.${normalized}`, normalized)}
    </span>
  );
}

/* ─── Compact stat box ──────────────────────────────────── */
function StatBox({ label, value, accent = "slate" }) {
  const accents = {
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <div className={`rounded-lg border p-3 md:p-4 ${accents[accent] || accents.slate}`}>
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-1 text-base md:text-lg font-extrabold">{value}</p>
    </div>
  );
}

/* ─── Table header cell ─────────────────────────────────── */
const TH = ({ children, className = "" }) => (
  <th className={`border border-slate-200 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 ${className}`}>
    {children}
  </th>
);

/* ─── Table body cell ───────────────────────────────────── */
const TD = ({ children, className = "" }) => (
  <td className={`border border-slate-200 px-3 py-3 text-xs text-slate-700 ${className}`}>
    {children}
  </td>
);

/* ════════════════════════════════════════════════════════════
   STUDENT PAYMENTS
   ════════════════════════════════════════════════════════════ */
function StudentPayments({ t, language }) {
  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const studentSkip = !isInitialized || !isAuthenticated;

  const { data, isLoading } = useGetMyPaymentsQuery(undefined, {
    skip: studentSkip,
  });
  const { data: enrollmentData, isLoading: enrollmentsLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: studentSkip,
  });
  const [createBkashPayment] = useCreateBkashPaymentMutation();
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");
  const { showError, popupNode } = useActionPopup();

  const payments = data?.data || [];
  const summary = data?.summary || { totalDue: 0, totalPaid: 0, dueCount: 0 };
  const approvedEnrollments = (enrollmentData?.data || []).filter(
    (item) => item.status === "approved" && item.batch
  );

  const courseMap = useMemo(() => {
    const map = new Map();
    approvedEnrollments.forEach((item) => {
      const batch = item.batch;
      if (batch?._id) map.set(String(batch._id), batch);
    });
    payments.forEach((payment) => {
      const batch = payment.batch;
      if (batch?._id && !map.has(String(batch._id))) map.set(String(batch._id), batch);
    });
    return map;
  }, [approvedEnrollments, payments]);

  const courseCards = useMemo(() => {
    const cards = [];
    const compareBilling = (a, b) => {
      if (a.billingYear !== b.billingYear) return Number(a.billingYear) - Number(b.billingYear);
      return Number(a.billingMonth) - Number(b.billingMonth);
    };
    courseMap.forEach((batch, batchId) => {
      const batchPayments = payments.filter(
        (payment) => String(payment.batch?._id || payment.batch) === batchId
      );
      const dueRecords = batchPayments.filter((payment) => payment.status === "due");
      const sortedDue = [...dueRecords].sort(compareBilling);
      cards.push({ batch, currentDue: sortedDue[0], dueCount: dueRecords.length });
    });
    cards.sort((a, b) => String(a.batch?.name || "").localeCompare(String(b.batch?.name || "")));
    return cards;
  }, [courseMap, payments]);

  const formatServiceMonth = (billingYear, billingMonth) => {
    if (!billingYear || !billingMonth) return "";
    const locale = language === "bn" ? "bn-BD" : "en-US";
    return new Date(Date.UTC(Number(billingYear), Number(billingMonth) - 1, 1)).toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const handlePay = async (paymentId) => {
    setError("");
    setPayingId(paymentId);
    try {
      const response = await createBkashPayment({ paymentId }).unwrap();
      if (response && response.bkashURL) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("lastPaymentRedirect", window.location.href);
        }
        window.location.href = response.bkashURL;
      } else {
        throw new Error("bKash redirect URL not provided by the server.");
      }
    } catch (payError) {
      setPayingId(null);
      const resolvedError = normalizeApiError(payError, t("paymentsPage.messages.paymentUpdateFailed", "Failed to initialize bKash payment."));
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <RevealSection className="space-y-5">
      {/* ── Summary stats ────────────────────────────── */}
      <RevealSection className="grid gap-3 sm:grid-cols-3">
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.dueAmount")} value={formatAmount(summary.totalDue, "BDT", language)} accent="amber" />
        </RevealItem>
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.paidAmount")} value={formatAmount(summary.totalPaid, "BDT", language)} accent="emerald" />
        </RevealItem>
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.dueMonths")} value={summary.dueCount} accent="slate" />
        </RevealItem>
      </RevealSection>


      {/* ── Course billing table ────────────────────── */}
      <section className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {t("paymentsPage.coursesTitle", "Course Billing")}
            </p>
            <h3 className="mt-1 text-sm font-extrabold text-slate-900">
              {t("paymentsPage.coursesSubtitle", "Each course shows the next due month to pay.")}
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {t("paymentsPage.studentStats.dueMonths")}: {summary.dueCount}
          </span>
        </div>

        {isLoading || enrollmentsLoading ? (
          <div className="p-5"><ListSkeleton rows={3} /></div>
        ) : courseCards.filter(c => c.currentDue).length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-slate-500">
            {t("paymentsPage.noDuePayment", "No due payment")}
          </div>
        ) : (
          <div className="overflow-x-hidden md:overflow-visible">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto">
              <table className="min-w-[780px] w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <TH>{t("paymentsPage.courseLabel", "Course")}</TH>
                    <TH>{t("paymentsPage.billingLabel", "Billing Month")}</TH>
                    <TH>{t("paymentsPage.amount")}</TH>
                    <TH>{t("paymentsPage.due")}</TH>
                    <TH>{t("paymentsPage.statusFilter", "Status")}</TH>
                    <TH>{t("paymentsPage.actionLabel", "Action")}</TH>
                  </tr>
                </thead>
                <RevealSection as="tbody" noStagger>
                  {courseCards.filter((card) => card.currentDue).map((card) => {
                    const { batch, currentDue, dueCount } = card;
                    const amountValue = currentDue.amount;
                    const currency = currentDue.currency || batch?.currency || "BDT";
                    const serviceLabel = formatServiceMonth(currentDue.billingYear, currentDue.billingMonth);
                    const dueDate = currentDue.dueDate
                      ? new Date(currentDue.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")
                      : "";

                    return (
                      <RevealItem
                        key={batch?._id || batch?.slug}
                        as="tr"
                        className="bg-white transition-colors hover:bg-slate-50/60"
                      >
                        <TD>
                          <p className="text-xs font-bold text-slate-900">
                            {batch?.name || t("paymentsPage.courseFallback", "Course")}
                          </p>
                          {serviceLabel ? (
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {t("paymentsPage.coversLabel", "Covers")}: {serviceLabel}
                            </p>
                          ) : null}
                        </TD>
                        <TD>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {getMonthName(currentDue.billingMonth, language)} {currentDue.billingYear}
                            </p>
                            {dueCount > 1 ? (
                              <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
                                +{dueCount - 1} {t("paymentsPage.multipleDue", "more months due")}
                              </p>
                            ) : null}
                          </div>
                        </TD>
                        <TD>
                          <span className="font-semibold text-slate-900">
                            {formatAmount(amountValue, currency, language)}
                          </span>
                        </TD>
                        <TD>{dueDate || <span className="text-slate-400">—</span>}</TD>
                        <TD>
                          <StatusPill status="due" t={t} />
                        </TD>
                        <TD>
                          <button
                            type="button"
                            disabled={payingId === currentDue._id}
                            onClick={() => handlePay(currentDue._id)}
                            className="site-button-primary text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {payingId === currentDue._id ? t("paymentsPage.processing") : t("paymentsPage.payOnlineFallback", "Pay via bKash")}
                          </button>
                        </TD>
                      </RevealItem>
                    );
                  })}
                </RevealSection>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {courseCards.filter((card) => card.currentDue).map((card) => {
                const { batch, currentDue, dueCount } = card;
                const amountValue = currentDue.amount;
                const currency = currentDue.currency || batch?.currency || "BDT";
                const serviceLabel = formatServiceMonth(currentDue.billingYear, currentDue.billingMonth);
                const dueDate = currentDue.dueDate
                  ? new Date(currentDue.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")
                  : "";

                return (
                  <article key={batch?._id || batch?.slug} className="p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {batch?.name || t("paymentsPage.courseFallback", "Course")}
                        </h4>
                        {serviceLabel && (
                          <p className="mt-0.5 text-[10px] text-slate-500">Covers: {serviceLabel}</p>
                        )}
                      </div>
                      <StatusPill status="due" t={t} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Billing Month</p>
                        <p className="text-[11px] font-semibold text-slate-800">
                          {getMonthName(currentDue.billingMonth, language)} {currentDue.billingYear}
                          {dueCount > 1 && (
                            <span className="ml-1 text-amber-600">+{dueCount - 1} due</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Due Amount</p>
                        <p className="text-[11px] font-extrabold text-slate-900">
                          {formatAmount(amountValue, currency, language)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Deadline</p>
                        <p className="text-[11px] font-semibold text-slate-800">{dueDate || "—"}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={payingId === currentDue._id}
                      onClick={() => handlePay(currentDue._id)}
                      className="site-button-primary w-full h-10 justify-center text-[11px] disabled:opacity-50"
                    >
                      {payingId === currentDue._id ? t("paymentsPage.processing") : t("paymentsPage.payOnlineFallback", "Pay via bKash")}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Full payment history ───────────────────── */}
      <section className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {t("paymentsPage.historyTitle", "Payment History")}
            </p>
            <h3 className="mt-1 text-sm font-extrabold text-slate-900">
              {t("paymentsPage.historySubtitle", "All months — paid & due")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("paymentsPage.status.paid_online", "Paid")}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {t("paymentsPage.status.paid_offline", "Offline")}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5"><ListSkeleton rows={4} /></div>
        ) : payments.filter((p) => ["paid_online", "paid_offline", "waived"].includes(p.status)).length === 0 ? (
          <p className="px-5 py-10 text-center text-xs text-slate-400">
            {t("paymentsPage.noHistoryRecords", "No completed payments yet.")}
          </p>
        ) : (
          <div className="overflow-x-hidden md:overflow-visible">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-auto">
              <table className="min-w-[820px] w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <TH>{t("paymentsPage.courseLabel", "Course")}</TH>
                    <TH>{t("paymentsPage.billingLabel", "Billing Month")}</TH>
                    <TH>{t("paymentsPage.coversLabel", "Covers (Service)")}</TH>
                    <TH>{t("paymentsPage.amount")}</TH>
                    <TH>{t("paymentsPage.due")}</TH>
                    <TH>{t("paymentsPage.statusFilter", "Status")}</TH>
                    <TH>{t("paymentsPage.methodLabel", "Method / Action")}</TH>
                  </tr>
                </thead>
                <tbody>
                  {[...payments]
                    .filter((p) => ["paid_online", "paid_offline", "waived"].includes(p.status))
                    .sort((a, b) => {
                      if (Number(a.billingYear) !== Number(b.billingYear)) return Number(b.billingYear) - Number(a.billingYear);
                      return Number(b.billingMonth) - Number(a.billingMonth);
                    })
                    .map((p) => {
                      const svcLabel = formatServiceMonth(p.billingYear, p.billingMonth);
                      const billLabel = `${getMonthName(p.billingMonth, language)} ${p.billingYear}`;
                      const dueDateStr = p.dueDate
                        ? new Date(p.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—";
                      const paidDateStr = p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { month: "short", day: "numeric" })
                        : null;
                      const methodLabel = { paid_online: "Online", paid_offline: "Offline", waived: "Waived" }[p.status];

                      return (
                        <tr
                          key={p._id}
                          className="bg-white transition-colors hover:bg-slate-50/60"
                        >
                          <TD>
                            <span className="font-semibold text-slate-900">
                              {p.batch?.name || t("paymentsPage.courseFallback", "Course")}
                            </span>
                          </TD>
                          <TD>
                            <span className="font-medium text-slate-800">{billLabel}</span>
                          </TD>
                          <TD>
                            <span className="text-slate-500">{svcLabel}</span>
                          </TD>
                          <TD>
                            <span className="font-semibold text-slate-900">
                              {formatAmount(p.amount, p.currency || "BDT", language)}
                            </span>
                          </TD>
                          <TD>{dueDateStr}</TD>
                          <TD>
                            <StatusPill status={p.status} t={t} />
                          </TD>
                          <TD>
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {methodLabel}
                              {paidDateStr ? <span className="text-slate-400">· {paidDateStr}</span> : null}
                            </span>
                          </TD>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {[...payments]
                .filter((p) => ["paid_online", "paid_offline", "waived"].includes(p.status))
                .sort((a, b) => {
                  if (Number(a.billingYear) !== Number(b.billingYear)) return Number(b.billingYear) - Number(a.billingYear);
                  return Number(b.billingMonth) - Number(a.billingMonth);
                })
                .map((p) => {
                  const svcLabel = formatServiceMonth(p.billingYear, p.billingMonth);
                  const billLabel = `${getMonthName(p.billingMonth, language)} ${p.billingYear}`;
                  const paidDateStr = p.paidAt
                    ? new Date(p.paidAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })
                    : null;
                  const methodLabel = { paid_online: "Online", paid_offline: "Offline", waived: "Waived" }[p.status];

                  return (
                    <article key={p._id} className="p-4 bg-white space-y-2.5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {p.batch?.name || t("paymentsPage.courseFallback", "Course")}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-slate-500">{billLabel}</p>
                        </div>
                        <StatusPill status={p.status} t={t} />
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-2.5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paid Amount</span>
                          <span className="text-[11px] font-extrabold text-slate-900">
                            {formatAmount(p.amount, p.currency || "BDT", language)}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Method & Date</span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {methodLabel} {paidDateStr ? `· ${paidDateStr}` : ""}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      {popupNode}
    </RevealSection>
  );
}

/* ════════════════════════════════════════════════════════════
   STAFF / ADMIN PAYMENTS
   ════════════════════════════════════════════════════════════ */
function StaffAdminPayments({ role, t, language }) {
  const canUpdate = role === "admin" || role === "moderator";
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [dueYear, setDueYear] = useState(new Date().getFullYear());
  const [dueMonth, setDueMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const staffSkip = !isInitialized || !isAuthenticated;

  const { data: batchesData } = useListBatchesQuery(undefined, {
    skip: staffSkip,
  });
  const { data: batchPaymentsData, isLoading: batchPaymentsLoading } = useGetBatchPaymentsQuery(
    {
      batchId: selectedBatchId,
      status: filterStatus !== "all" ? filterStatus : undefined,
      billingYear: filterYear,
      billingMonth: filterMonth !== "all" ? filterMonth : undefined,
    },
    { skip: staffSkip || !selectedBatchId }
  );
  const { data: globalSummaryData, isLoading: globalSummaryLoading } = useGetGlobalPaymentsQuery(
    undefined,
    { skip: staffSkip || !isAdmin(role) }
  );
  const showGlobalLedger = isAdmin(role) && !selectedBatchId;
  const { data: globalLedgerData, isLoading: globalLedgerLoading } = useGetGlobalPaymentsQuery(
    showGlobalLedger
      ? {
          status: filterStatus !== "all" ? filterStatus : undefined,
          billingYear: filterYear,
          billingMonth: filterMonth !== "all" ? filterMonth : undefined,
        }
      : undefined,
    { skip: staffSkip || !showGlobalLedger }
  );

  const [markPaymentOfflinePaid] = useMarkPaymentOfflinePaidMutation();
  const [waivePayment, { isLoading: waiving }] = useWaivePaymentMutation();
  const [generateMonthlyDues, { isLoading: generatingDues }] = useGenerateMonthlyDuesMutation();
  const { showSuccess, showError, requestConfirmation, requestPrompt, popupNode } = useActionPopup();

  const batches = batchesData?.data || [];
  const batchPayments = batchPaymentsData?.data || [];
  const globalPayments = globalSummaryData?.data || [];
  
  const formattedSearch = searchStudent.trim().toLowerCase();
  const rawLedgerPayments = showGlobalLedger ? globalLedgerData?.data || [] : batchPayments;
  const ledgerPayments = useMemo(() => {
    if (!formattedSearch) return rawLedgerPayments;
    return rawLedgerPayments.filter((p) => {
      const name = p.student?.fullName || "";
      return name.toLowerCase().includes(formattedSearch);
    });
  }, [rawLedgerPayments, formattedSearch]);
  
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
    const isConfirmed = await requestConfirmation(
      t("paymentsPage.messages.confirmOfflineMark", "Are you sure you want to mark this payment as paid offline?"),
      t("paymentsPage.confirmTitle", "Verify Payment"),
      t("paymentsPage.confirmProceed", "Yes, Mark Paid")
    );
    if (!isConfirmed) return;

    setError("");
    setMarkingId(paymentId);
    try {
      await markPaymentOfflinePaid({
        paymentId,
        note: t("paymentsPage.markedByStaffNote"),
      }).unwrap();
    } catch (markError) {
      const resolvedError = normalizeApiError(markError, t("paymentsPage.messages.markOfflineFailed"));
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setMarkingId(null);
    }
  };

  const handleWaive = async (paymentId) => {
    const reason = await requestPrompt(
      t("paymentsPage.messages.waivePrompt", "Enter reason for waiving this payment (optional):"),
      t("paymentsPage.waiveTitle", "Waive Payment"),
      "Student hardship / Scholarship",
      t("paymentsPage.confirmWaive", "Waive Dues")
    );
    
    if (reason === undefined) return; // User cancelled the modal

    setError("");
    setMarkingId(paymentId);
    try {
      await waivePayment({
        paymentId,
        note: reason || "Payment waived by staff",
      }).unwrap();
    } catch (waiveErr) {
      const resolvedError = normalizeApiError(waiveErr, "Failed to waive payment.");
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setMarkingId(null);
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

  const formatServiceMonth = (billingYear, billingMonth) => {
    if (!billingYear || !billingMonth) return "";
    const locale = language === "bn" ? "bn-BD" : "en-US";
    return new Date(Date.UTC(Number(billingYear), Number(billingMonth) - 1, 1)).toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const methodLabel = (method) => {
    if (method === "bkash") return t("paymentsPage.methodBkash", "bKash");
    if (method === "offline") return t("paymentsPage.methodOffline", "Offline");
    if (method === "manual_adjustment") return t("paymentsPage.methodAdjusted", "Manual Adjustment");
    return t("paymentsPage.methodPending", "Pending");
  };

  return (
    <RevealSection className="space-y-5">
      {/* ── Global stats (Admin only) ────────────────── */}
      {isAdmin(role) ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t("paymentsPage.adminStats.totalGlobalRecords")}
            </p>
            <div className="mt-1 min-h-[24px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="text-lg font-extrabold text-slate-900">{globalSummaryData?.count || 0}</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
              {t("paymentsPage.adminStats.globalDueRecords")}
            </p>
            <div className="mt-1 min-h-[24px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="text-lg font-extrabold text-amber-700">{globalDueSummary}</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
              {t("paymentsPage.adminStats.globalPaidRecords")}
            </p>
            <div className="mt-1 min-h-[24px]">
              {globalSummaryLoading ? (
                <InlineLoader label={t("paymentsPage.loading")} />
              ) : (
                <p className="text-lg font-extrabold text-emerald-700">{globalPaidTotalSummary}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── Ledger panel ───────────────────────────── */}
        <section className="space-y-4">
          {/* Ledger snapshot stats */}
          <div className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)]">
            <div className="border-b border-slate-200 px-4 py-3 md:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {t("paymentsPage.ledgerKicker", "Ledger Snapshot")}
                  </p>
                  <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                    {t("paymentsPage.ledgerTitle", "Payment Ledger")}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {showGlobalLedger
                      ? t("paymentsPage.globalLedger", "Global Ledger")
                      : selectedBatch?.name || t("paymentsPage.batchLedger", "Batch Ledger")}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {ledgerSummary.total}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200">
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">{t("paymentsPage.status.due", "Due")}</p>
                <p className="mt-0.5 text-base font-extrabold text-amber-700">{ledgerSummary.due}</p>
              </div>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600">{t("paymentsPage.status.paid_online", "Paid Online")}</p>
                <p className="mt-0.5 text-base font-extrabold text-emerald-700">{ledgerSummary.paidOnline}</p>
              </div>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-sky-600">{t("paymentsPage.status.paid_offline", "Paid Offline")}</p>
                <p className="mt-0.5 text-base font-extrabold text-sky-700">{ledgerSummary.paidOffline}</p>
              </div>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{t("paymentsPage.status.waived", "Waived")}</p>
                <p className="mt-0.5 text-base font-extrabold text-slate-600">{ledgerSummary.waived}</p>
              </div>
            </div>

            {error ? (
              <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {/* Ledger table */}
            {ledgerLoading ? (
              <div className="p-5"><ListSkeleton rows={4} /></div>
            ) : !selectedBatchId && !showGlobalLedger ? (
              <div className="px-5 py-10 text-center text-xs text-slate-500">
                {t("paymentsPage.selectBatchPrompt", "Select a batch to view payment records.")}
              </div>
            ) : ledgerPayments.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-slate-500">
                {t("paymentsPage.noBatchRecords")}
              </div>
            ) : (
              <div className="overflow-x-hidden md:overflow-visible">
                {/* Desktop Table View */}
                <div className="hidden md:block max-h-[65vh] overflow-auto">
                  <table className="min-w-[900px] w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <TH>{t("paymentsPage.studentFallback", "Student")}</TH>
                        <TH>{t("paymentsPage.batchFallback", "Batch")}</TH>
                        <TH>{t("paymentsPage.billingLabel", "Billing Period")}</TH>
                        <TH>{t("paymentsPage.coversLabel", "Service Month")}</TH>
                        <TH>{t("paymentsPage.amount")}</TH>
                        <TH>{t("paymentsPage.statusFilter", "Status")}</TH>
                        <TH>{t("paymentsPage.method", "Method")}</TH>
                        <TH>{t("paymentsPage.actionLabel", "Action")}</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerPayments.map((payment) => {
                        const batchName = payment.batch?.name || selectedBatch?.name || t("paymentsPage.batchFallback", "Batch");
                        const studentName = payment.student?.fullName || t("paymentsPage.studentFallback", "Student");

                        return (
                          <tr key={payment._id} className="bg-white transition-colors hover:bg-slate-50/60">
                            <TD>
                              <span className="font-semibold text-slate-900">{studentName}</span>
                            </TD>
                            <TD>{batchName}</TD>
                            <TD>
                              <span className="font-medium">
                                {getMonthName(payment.billingMonth, language)} {payment.billingYear}
                              </span>
                            </TD>
                            <TD className="text-[11px]">{formatServiceMonth(payment.billingYear, payment.billingMonth)}</TD>
                            <TD>
                              <span className="font-semibold text-slate-900">
                                {formatAmount(payment.amount, payment.currency || "BDT", language)}
                              </span>
                            </TD>
                            <TD><StatusPill status={payment.status} t={t} /></TD>
                            <TD className="text-[11px]">
                              <span>{methodLabel(payment.paymentMethod)}</span>
                              {payment.paidAt ? (
                                <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(payment.paidAt)}</p>
                              ) : null}
                            </TD>
                            <TD>
                              {payment.status === "due" && canUpdate ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={!!markingId}
                                    onClick={() => handleOfflineMark(payment._id)}
                                    className="site-button-primary text-[10px]"
                                  >
                                    {markingId === payment._id && !waiving ? t("paymentsPage.updating") : t("paymentsPage.markPaidOffline")}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!!markingId}
                                    onClick={() => handleWaive(payment._id)}
                                    className="site-button-danger !px-4 !py-1.5"
                                  >
                                    {markingId === payment._id && waiving ? "Waiving..." : "Waive"}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-slate-100 max-h-[70vh] overflow-auto">
                  {ledgerPayments.map((payment) => {
                    const batchName = payment.batch?.name || selectedBatch?.name || t("paymentsPage.batchFallback", "Batch");
                    const studentName = payment.student?.fullName || t("paymentsPage.studentFallback", "Student");
                    const billPeriod = `${getMonthName(payment.billingMonth, language)} ${payment.billingYear}`;

                    return (
                      <article key={payment._id} className="p-4 bg-white space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{studentName}</h4>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{batchName}</p>
                          </div>
                          <StatusPill status={payment.status} t={t} />
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Billing Period</p>
                            <p className="text-[11px] font-semibold text-slate-800 leading-tight">{billPeriod}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{formatServiceMonth(payment.billingYear, payment.billingMonth)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Amount</p>
                            <p className="text-[11px] font-extrabold text-slate-900">
                              {formatAmount(payment.amount, payment.currency || "BDT", language)}
                            </p>
                          </div>
                          {payment.paidAt && (
                            <div className="col-span-2 border-t border-slate-200 pt-2 flex justify-between items-center">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paid Method & Date</p>
                              <p className="text-[10px] font-medium text-slate-700">
                                {methodLabel(payment.paymentMethod)} · {formatDate(payment.paidAt)}
                              </p>
                            </div>
                          )}
                        </div>

                        {payment.status === "due" && canUpdate && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              disabled={!!markingId}
                              onClick={() => handleOfflineMark(payment._id)}
                              className="site-button-primary justify-center text-[10px] py-1.5"
                            >
                              {markingId === payment._id && !waiving ? "..." : "Mark Paid"}
                            </button>
                            <button
                              type="button"
                              disabled={!!markingId}
                              onClick={() => handleWaive(payment._id)}
                              className="site-button-danger justify-center text-[10px] py-1.5"
                            >
                              {markingId === payment._id && waiving ? "..." : "Waive"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Sidebar ────────────────────────────────── */}
        <aside className="space-y-4">
          {/* Filters */}
          <div className="site-panel rounded-[clamp(8px,5%,12px)] p-4">
            <h3 className="text-xs font-extrabold text-slate-900">
              {t("paymentsPage.filtersTitle", "Ledger Filters")}
            </h3>
            <p className="mt-1 text-[10px] text-slate-500">
              {t("paymentsPage.filtersSubtitle", "Scope the ledger by batch, month, and payment status.")}
            </p>
            <div className="mt-4 grid gap-3">
              <FloatingInput
                id="searchStudent"
                label={t("paymentsPage.searchStudent", "Search Student Name")}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
              
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
                  <option key={batch._id} value={batch._id}>{batch.name}</option>
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

              <div className="grid gap-2 sm:grid-cols-2">
                <FloatingInput
                  type="number"
                  min="2000"
                  max="2100"
                  label={t("paymentsPage.billingYear")}
                  value={filterYear}
                  onChange={(event) => setFilterYear(event.target.value)}
                />
                <FloatingSelect
                  label={t("paymentsPage.billingMonth")}
                  value={filterMonth}
                  onChange={(event) => setFilterMonth(event.target.value)}
                >
                  <option value="all">{t("paymentsPage.statusAll", "All Months")}</option>
                  {MONTH_NAMES_EN.slice(1).map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {language === "bn" ? MONTH_NAMES_BN[idx + 1] : name}
                    </option>
                  ))}
                </FloatingSelect>
              </div>
            </div>
          </div>

          {/* Dues Generation (Admin only) */}
          {isAdmin(role) && (
            <div className="site-panel rounded-[clamp(8px,5%,12px)] p-4">
              <h3 className="text-xs font-extrabold text-slate-900">
                {t("paymentsPage.generateDuesTitle", "Monthly Billing")}
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">
                {t("paymentsPage.generateDuesSubtitle", "Generate payment records for the selected month.")}
              </p>
              <form onSubmit={handleGenerateDues} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <FloatingInput
                    type="number"
                    min="2024"
                    max="2100"
                    label={t("paymentsPage.dueYear", "Year")}
                    value={dueYear}
                    onChange={(e) => setDueYear(e.target.value)}
                  />
                  <FloatingSelect
                    label={t("paymentsPage.dueMonth", "Month")}
                    value={dueMonth}
                    onChange={(e) => setDueMonth(e.target.value)}
                  >
                    {MONTH_NAMES_EN.slice(1).map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {language === "bn" ? MONTH_NAMES_BN[idx + 1] : name}
                      </option>
                    ))}
                  </FloatingSelect>
                </div>
                <button
                  type="submit"
                  disabled={generatingDues}
                  className="site-button-primary w-full h-10 justify-center text-[11px]"
                >
                  {generatingDues ? t("paymentsPage.generating", "Generating...") : t("paymentsPage.generateBtn", "Generate Dues")}
                </button>
              </form>
            </div>
          )}

        </aside>
      </div>
      {popupNode}
    </RevealSection>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE WRAPPER
   ════════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  const role = useSelector(selectCurrentUserRole);
  const { t, language } = useSiteLanguage();

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <RevealSection noStagger>
          <div className="relative mb-12">
            {/* Decorative Accent */}
            <div className="h-1.5 w-32 rounded-full bg-emerald-400 mb-8" />

            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  {t("paymentsPage.hero.badge", "Financial Desk")}
                </span>

                <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-[32px] leading-tight">
                  <span className="text-emerald-600">
                    {t("paymentsPage.hero.accent", "Payment Dashboard")}
                  </span>{" "}
                  {t("paymentsPage.hero.title", "and Billing History")}
                </h1>

                <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                  {t("paymentsPage.hero.description", "Students can review dues and sandbox payment actions. Staff and administrators can monitor course-level records and mark offline collections.")}
                </p>
              </div>

              {role && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Status</span>
                  <RoleBadge role={role} />
                </div>
              )}
            </div>
          </div>
        </RevealSection>

        <div className="mt-4">
          <RevealSection noStagger>
            <RevealItem>
              {isStudent(role) ? (
                <StudentPayments t={t} language={language} />
              ) : (
                <StaffAdminPayments role={role} t={t} language={language} />
              )}
            </RevealItem>
          </RevealSection>
        </div>
      </section>
    </RequireAuth>
  );
}
