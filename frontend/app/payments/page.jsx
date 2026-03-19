"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Filter, X, Check } from "lucide-react";
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
import { selectCurrentUserRole, selectCurrentUserDisplayName } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";
import { generatePaymentReceipt } from "@/lib/utils/pdfReceiptGenerator";

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
    <span className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full border px-2 py-0.5 md:px-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.08em] md:tracking-[0.1em] ${style.chip}`}>
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
  <th className={`px-3 py-2.5 text-[9px] md:px-4 md:py-3 md:text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ${className}`}>
    {children}
  </th>
);

/* ─── Table body cell ───────────────────────────────────── */
const TD = ({ children, className = "" }) => (
  <td className={`px-3 py-3 text-[11px] md:px-4 md:py-4 md:text-xs text-slate-600 ${className}`}>
    {children}
  </td>
);

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */
const getDynamicYears = (currentYear) => {
  const years = [];
  for (let y = 2026; y <= currentYear; y++) {
    years.push(y);
  }
  return years.reverse();
};

const LedgerFiltersContent = ({
  t,
  // we hide the search input inside mobile drawer to keep it focused on structured filters
  showSearch = true, 
  searchStudent,
  setSearchStudent,
  selectedBatchId,
  setSelectedBatchId,
  filterStatus,
  setFilterStatus,
  filterYear,
  setFilterYear,
  filterMonth,
  setFilterMonth,
  batches,
  isAdmin,
  role,
  dynamicYears,
  language,
}) => {
  return (
    <div className="grid gap-3">
      {showSearch && (
        <FloatingInput
          id="searchStudent"
          label={t("paymentsPage.searchStudent", "Search Student Name")}
          value={searchStudent}
          onChange={(e) => setSearchStudent(e.target.value)}
        />
      )}
      
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

      <div className="grid gap-2 grid-cols-2">
        <FloatingSelect
          label={t("paymentsPage.billingYear")}
          value={filterYear}
          onChange={(event) => setFilterYear(event.target.value)}
        >
          <option value="all">{t("paymentsPage.statusAll", "All Years")}</option>
          {dynamicYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </FloatingSelect>
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
  );
};

function LedgerMetricCard({ label, value, tone = "slate" }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
    sky: "border-sky-200 bg-sky-50/80 text-sky-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`rounded-xl border px-2.5 py-2.5 md:rounded-2xl md:px-3 md:py-3.5 ${tones[tone] || tones.slate}`}>
      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.12em] md:tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-1 text-base md:text-lg font-black">{value}</p>
    </div>
  );
}

function MonthlyBillingForm({
  t,
  language,
  dynamicYears,
  dueYear,
  setDueYear,
  dueMonth,
  setDueMonth,
  dueBatchIds,
  setDueBatchIds,
  batches,
  generatingDues,
  handleGenerateDues,
  compact = false,
}) {
  const toggleBatchSelection = (batchId) => {
    setDueBatchIds((current) =>
      current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId]
    );
  };

  return (
    <form onSubmit={handleGenerateDues} className={compact ? "space-y-4" : "mt-4 space-y-3"}>
      <div className="grid grid-cols-2 gap-2.5">
        <FloatingSelect
          label={t("paymentsPage.billingYear", "Year")}
          value={dueYear}
          onChange={(event) => setDueYear(event.target.value)}
        >
          {dynamicYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label={t("paymentsPage.billingMonth", "Month")}
          value={dueMonth}
          onChange={(event) => setDueMonth(event.target.value)}
        >
          {MONTH_NAMES_EN.slice(1).map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {language === "bn" ? MONTH_NAMES_BN[idx + 1] : name}
            </option>
          ))}
        </FloatingSelect>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("paymentsPage.selectBatches", "Select Batches")}
          </p>
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {dueBatchIds.length} {t("paymentsPage.selectedCountLabel", "selected")}
          </span>
        </div>

        {batches.length > 0 ? (
          <div className={compact
            ? "max-h-[280px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2 custom-scrollbar"
            : "max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2 custom-scrollbar"}
          >
            <div className="grid gap-2">
              {batches.map((batch) => {
                const isSelected = dueBatchIds.includes(batch._id);
                return (
                  <button
                    key={batch._id}
                    type="button"
                    onClick={() => toggleBatchSelection(batch._id)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[11px] md:text-xs font-semibold leading-5">{batch.name}</span>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-xs text-slate-500">
            {t("paymentsPage.noBatchesAvailable", "No batches available right now.")}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={generatingDues || dueBatchIds.length === 0}
        className={compact
          ? "site-button-primary w-full min-h-10 md:min-h-11 justify-center text-[9px] md:text-[10px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          : "site-button-primary w-full h-10 justify-center text-[11px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"}
      >
        {generatingDues
          ? t("paymentsPage.generatingDues", "Generating...")
          : t("paymentsPage.generateDuesAction", "Generate Dues")}
      </button>
    </form>
  );
}

function PaginationControls({ page, totalPages, onPrev, onNext, t, disabled = false, loading = false }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 px-3 py-3 md:px-4 md:py-4" aria-busy={loading}>
      <button
        type="button"
        disabled={disabled || page === 1}
        onClick={onPrev}
        className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 md:h-9 md:w-9 md:rounded-xl"
      >
        <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex h-8 items-center rounded-lg bg-slate-950 px-3 text-[9px] font-black text-white shadow-lg md:h-9 md:rounded-xl md:px-4 md:text-[10px]">
        <span className="mr-1.5 text-[7px] uppercase tracking-widest opacity-40 md:mr-2 md:text-[8px]">
          {t("paymentsPage.pagination.page", "Page")}
        </span>
        {page}
        <span className="mx-1 opacity-20">/</span>
        {totalPages}
        {loading ? (
          <span className="ml-2 hidden text-[7px] uppercase tracking-widest text-white/60 min-[380px]:inline">
            {t("paymentsPage.loading", "Loading")}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || page === totalPages}
        onClick={onNext}
        className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 md:h-9 md:w-9 md:rounded-xl"
      >
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   STUDENT PAYMENTS
   ════════════════════════════════════════════════════════════ */
function StudentPayments({ t, language }) {
  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const studentSkip = !isInitialized || !isAuthenticated;

  const { data, isLoading } = useGetMyPaymentsQuery(undefined, {
    skip: studentSkip,
  });
  const { data: enrollmentData, isLoading: enrollmentsLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: studentSkip,
  });
  const [createBkashPayment] = useCreateBkashPaymentMutation();
  const { showError, popupNode } = useActionPopup();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [stdFilterYear, setStdFilterYear] = useState(currentYear);
  const [stdFilterMonth, setStdFilterMonth] = useState(currentMonth);
  const dynamicYears = useMemo(() => getDynamicYears(currentYear), [currentYear]);

  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");
  const paying = payingId !== null;
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const activeFilterCount = (stdFilterYear !== "all" ? 1 : 0) + (stdFilterMonth !== "all" ? 1 : 0);

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
    <div className="space-y-5">
      {/* ── Summary stats ────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.dueAmount")} value={formatAmount(summary.totalDue, "BDT", language)} accent="amber" />
        </RevealItem>
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.paidAmount")} value={formatAmount(summary.totalPaid, "BDT", language)} accent="emerald" />
        </RevealItem>
        <RevealItem>
          <StatBox label={t("paymentsPage.studentStats.dueMonths")} value={summary.dueCount} accent="slate" />
        </RevealItem>
      </div>


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
            <div className="hidden md:block overflow-auto max-h-[500px] custom-scrollbar">
              <table className="min-w-[780px] w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <TH>{t("paymentsPage.courseLabel", "Course")}</TH>
                    <TH>{t("paymentsPage.billingLabel", "Billing Month")}</TH>
                    <TH>{t("paymentsPage.amount")}</TH>
                    <TH>{t("paymentsPage.due")}</TH>
                    <TH>{t("paymentsPage.statusFilter", "Status")}</TH>
                    <TH className="text-right">{t("paymentsPage.actions")}</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        <TD>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-slate-600 italic">
                              {t("paymentsPage.dueOn", "Due on")}: {dueDate || "—"}
                            </span>
                          </div>
                        </TD>
                        <TD>
                          <StatusPill status="due" t={t} />
                        </TD>
                        <TD className="text-right">
                          <button
                            onClick={() => handlePay(currentDue)}
                            disabled={paying}
                            className="site-button-primary scale-90"
                          >
                            {paying ? t("paymentsPage.updating") : t("paymentsPage.payNow")}
                          </button>
                        </TD>
                      </RevealItem>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden overflow-auto custom-scrollbar max-h-[500px] -mx-4 px-4 space-y-3">
              {courseCards.filter((card) => card.currentDue).map((card) => {
                const { batch, currentDue, dueCount } = card;
                const serviceLabel = formatServiceMonth(currentDue.billingYear, currentDue.billingMonth);
                const dueDate = currentDue.dueDate
                  ? new Date(currentDue.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")
                  : "";

                return (
                  <RevealItem
                    key={batch?._id || batch?.slug}
                    className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {batch?.name || t("paymentsPage.courseFallback")}
                        </h4>
                        <StatusPill status="due" t={t} className="mt-1" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">
                          {formatAmount(currentDue.amount, currentDue.currency || "BDT", language)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-tight">Period</p>
                        <p className="mt-0.5 font-bold text-slate-800">
                          {getMonthName(currentDue.billingMonth, language)} {currentDue.billingYear}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-tight">Due Date</p>
                        <p className="mt-0.5 font-bold text-amber-600">{dueDate || "—"}</p>
                      </div>
                    </div>

                    {serviceLabel && (
                      <p className="text-[10px] text-slate-500 italic">
                        {t("paymentsPage.coversLabel")}: {serviceLabel}
                      </p>
                    )}

                    {dueCount > 1 && (
                      <p className="text-[10px] font-bold text-amber-600">
                        {t("paymentsPage.multipleDuePrefix", "Notice")}: {dueCount - 1} {t("paymentsPage.multipleDue", "more months due")}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={payingId === currentDue._id}
                      onClick={() => handlePay(currentDue._id)}
                      className="site-button-primary w-full h-10 justify-center text-[11px] disabled:opacity-50"
                    >
                      {payingId === currentDue._id ? t("paymentsPage.processing") : t("paymentsPage.payOnlineFallback", "Pay via bKash")}
                    </button>
                  </RevealItem>
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
              {t("paymentsPage.historySubtitle", "Past transactions and receipts")}
            </h3>
          </div>
          {/* Desktop Filters */}
          <div className="hidden md:flex flex-wrap items-center gap-3">
            <div className="w-[100px]">
              <FloatingSelect
                label={t("paymentsPage.billingYear")}
                value={stdFilterYear}
                onChange={(e) => setStdFilterYear(e.target.value)}
              >
                <option value="all">{t("paymentsPage.statusAll", "All Years")}</option>
                {dynamicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </FloatingSelect>
            </div>
            <div className="w-[120px]">
              <FloatingSelect
                label={t("paymentsPage.billingMonth")}
                value={stdFilterMonth}
                onChange={(e) => setStdFilterMonth(e.target.value)}
              >
                <option value="all">{t("paymentsPage.statusAll", "All Months")}</option>
                {MONTH_NAMES_EN.slice(1).map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {language === "bn" ? MONTH_NAMES_BN[idx + 1] : m}
                  </option>
                ))}
              </FloatingSelect>
            </div>
          </div>
          
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 active:scale-95 transition-all relative"
          >
            <Filter className="h-3 w-3" />
            {t("paymentsPage.filters", "Filters")}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
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
                    <TH>{t("paymentsPage.receiptLabel", "Receipt")}</TH>
                  </tr>
                </thead>
                <tbody>
                  {[...payments]
                    .filter((p) => ["paid_online", "paid_offline", "waived"].includes(p.status))
                    .filter((p) => {
                      if (stdFilterYear !== "all" && Number(p.billingYear) !== Number(stdFilterYear)) return false;
                      if (stdFilterMonth !== "all" && Number(p.billingMonth) !== Number(stdFilterMonth)) return false;
                      return true;
                    })
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
                          <TD>
                            <button
                              onClick={() => generatePaymentReceipt({
                                payment: p,
                                studentName: userDisplayName,
                                t,
                                language,
                                getMonthName,
                                formatAmount,
                                formatServiceMonth
                              })}
                              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              Download
                            </button>
                          </TD>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {payments.filter(p => ["paid_online", "paid_offline", "waived"].includes(p.status)).filter((p) => {
                if (stdFilterYear !== "all" && Number(p.billingYear) !== Number(stdFilterYear)) return false;
                if (stdFilterMonth !== "all" && Number(p.billingMonth) !== Number(stdFilterMonth)) return false;
                return true;
              }).length === 0 && (
                <div className="py-12 text-center bg-white">
                  <p className="text-xs font-semibold text-slate-400">No matching history records found for the selected filters.</p>
                </div>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden overflow-auto custom-scrollbar max-h-[500px] divide-y divide-slate-100">
              {[...payments]
                .filter((p) => ["paid_online", "paid_offline", "waived"].includes(p.status))
                .filter((p) => {
                  if (stdFilterYear !== "all" && Number(p.billingYear) !== Number(stdFilterYear)) return false;
                  if (stdFilterMonth !== "all" && Number(p.billingMonth) !== Number(stdFilterMonth)) return false;
                  return true;
                })
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
                      <div className="border-t border-slate-50 pt-2">
                        <button
                          onClick={() => generatePaymentReceipt({
                            payment: p,
                            studentName: userDisplayName,
                            t,
                            language,
                            getMonthName,
                            formatAmount,
                            formatServiceMonth
                          })}
                          className="w-full flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download Receipt
                        </button>
                      </div>
                    </article>
                  );
                })}
              {payments.filter(p => ["paid_online", "paid_offline", "waived"].includes(p.status)).filter((p) => {
                if (stdFilterYear !== "all" && Number(p.billingYear) !== Number(stdFilterYear)) return false;
                if (stdFilterMonth !== "all" && Number(p.billingMonth) !== Number(stdFilterMonth)) return false;
                return true;
              }).length === 0 && (
                <div className="py-12 text-center bg-white px-4">
                  <p className="text-xs font-semibold text-slate-400">No matching history records found for the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Mobile Drawer (Student History) */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ translateY: "100%" }}
              animate={{ translateY: 0 }}
              exit={{ translateY: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[70] mt-10 max-h-[85vh] rounded-t-3xl bg-white shadow-2xl md:hidden flex flex-col pt-3"
            >
              <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />
              
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">History Filters</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refine past transactions</p>
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 p-6">
                <FloatingSelect
                  label={t("paymentsPage.billingYear")}
                  value={stdFilterYear}
                  onChange={(e) => setStdFilterYear(e.target.value)}
                >
                  <option value="all">{t("paymentsPage.statusAll", "All Years")}</option>
                  {dynamicYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </FloatingSelect>

                <FloatingSelect
                  label={t("paymentsPage.billingMonth")}
                  value={stdFilterMonth}
                  onChange={(e) => setStdFilterMonth(e.target.value)}
                >
                  <option value="all">{t("paymentsPage.statusAll", "All Months")}</option>
                  {MONTH_NAMES_EN.slice(1).map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {language === "bn" ? MONTH_NAMES_BN[idx + 1] : m}
                    </option>
                  ))}
                </FloatingSelect>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [dueYear, setDueYear] = useState(currentYear);
  const [dueMonth, setDueMonth] = useState(currentMonth);
  const dynamicYears = useMemo(() => getDynamicYears(currentYear), [currentYear]);

  const [dueBatchIds, setDueBatchIds] = useState([]);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileBilling, setShowMobileBilling] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerPageSize = 10;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchStudent.trim()) count++;
    if (filterStatus !== "all") count++;
    if (filterYear !== "all") count++;
    if (filterMonth !== "all") count++;
    if (selectedBatchId !== "") count++;
    return count;
  }, [searchStudent, filterStatus, filterYear, filterMonth, selectedBatchId]);

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const staffSkip = !isInitialized || !isAuthenticated;

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  const { data: batchesData } = useListBatchesQuery(undefined, {
    skip: staffSkip,
  });
  const {
    data: batchPaymentsData,
    isLoading: batchPaymentsLoading,
    isFetching: batchPaymentsFetching,
  } = useGetBatchPaymentsQuery(
    {
      batchId: selectedBatchId,
      status: filterStatus !== "all" ? filterStatus : undefined,
      billingYear: filterYear !== "all" ? filterYear : undefined,
      billingMonth: filterMonth !== "all" ? filterMonth : undefined,
      page: ledgerPage,
      limit: ledgerPageSize,
      search: searchStudent,
    },
    { skip: staffSkip || !selectedBatchId }
  );
  const { data: globalSummaryData, isLoading: globalSummaryLoading } = useGetGlobalPaymentsQuery(
    { summaryOnly: true },
    { skip: staffSkip || !isAdmin(role) }
  );
  const showGlobalLedger = isAdmin(role) && !selectedBatchId;
  const {
    data: globalLedgerData,
    isLoading: globalLedgerLoading,
    isFetching: globalLedgerFetching,
  } = useGetGlobalPaymentsQuery(
    showGlobalLedger
      ? {
          status: filterStatus !== "all" ? filterStatus : undefined,
          billingYear: filterYear !== "all" ? filterYear : undefined,
          billingMonth: filterMonth !== "all" ? filterMonth : undefined,
          page: ledgerPage,
          limit: ledgerPageSize,
          search: searchStudent,
        }
      : undefined,
    { skip: staffSkip || !showGlobalLedger }
  );

  const [markPaymentOfflinePaid] = useMarkPaymentOfflinePaidMutation();
  const [waivePayment, { isLoading: waiving }] = useWaivePaymentMutation();
  const [generateMonthlyDues, { isLoading: generatingDues }] = useGenerateMonthlyDuesMutation();
  const { showSuccess, showError, requestConfirmation, requestPrompt, popupNode } = useActionPopup();

  const batches = batchesData?.data || [];
  const globalSummary = globalSummaryData?.summary || {
    total: 0,
    due: 0,
    paidOnline: 0,
    paidOffline: 0,
    waived: 0,
    paid: 0,
  };
  const ledgerResponse = showGlobalLedger ? globalLedgerData : batchPaymentsData;
  const ledgerPayments = ledgerResponse?.data || [];
  const ledgerSummary = ledgerResponse?.summary || {
    total: 0,
    due: 0,
    paidOnline: 0,
    paidOffline: 0,
    waived: 0,
  };
  const totalLedgerPages = Math.max(1, ledgerResponse?.pagination?.pages || 1);
  const currentLedgerPage = ledgerPage;
  const ledgerLoading = showGlobalLedger ? globalLedgerLoading : batchPaymentsLoading;
  const ledgerFetching = showGlobalLedger ? globalLedgerFetching : batchPaymentsFetching;
  const selectedBatch = batches.find((batch) => batch._id === selectedBatchId);

  const adminSummaryCards = [
    {
      key: "total",
      label: t("paymentsPage.adminStats.totalGlobalRecords"),
      value: globalSummaryData?.count || 0,
      borderClass: "border-slate-200",
      bgClass: "bg-white",
      textClass: "text-slate-900",
      labelClass: "text-slate-400",
    },
    {
      key: "due",
      label: t("paymentsPage.adminStats.globalDueRecords"),
      value: globalSummary.due,
      borderClass: "border-amber-200",
      bgClass: "bg-amber-50/60",
      textClass: "text-amber-700",
      labelClass: "text-amber-600",
    },
    {
      key: "paid",
      label: t("paymentsPage.adminStats.globalPaidRecords"),
      value: globalSummary.paid,
      borderClass: "border-emerald-200",
      bgClass: "bg-emerald-50/60",
      textClass: "text-emerald-700",
      labelClass: "text-emerald-600",
    },
  ];

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
        batchIds: dueBatchIds,
      }).unwrap();
      showSuccess(t("paymentsPage.messages.duesGenerated"));
      setShowMobileBilling(false);
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
    return new Date(Date.UTC(Number(billingYear), Number(billingMonth) - 2, 1)).toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const methodLabel = (method) => {
    if (method === "bkash") return t("paymentsPage.methodBkash", "bKash");
    if (method === "offline") return t("paymentsPage.methodOffline", "Offline");
    if (method === "manual_adjustment") return t("paymentsPage.methodAdjusted", "Manual Adjustment");
    return t("paymentsPage.methodPending", "Pending");
  };

  const resetLedgerFilters = () => {
    setSearchStudent("");
    setSelectedBatchId("");
    setFilterStatus("all");
    setFilterYear("all");
    setFilterMonth("all");
  };

  const ledgerScopeLabel = showGlobalLedger
    ? t("paymentsPage.globalLedger", "Global Ledger")
    : selectedBatch?.name || t("paymentsPage.selectBatch", "Select a batch");

  useEffect(() => {
    setLedgerPage(1);
  }, [selectedBatchId, searchStudent, filterStatus, filterYear, filterMonth]);

  useEffect(() => {
    if (!ledgerFetching && ledgerResponse?.pagination?.page && ledgerResponse.pagination.page !== ledgerPage) {
      setLedgerPage(ledgerResponse.pagination.page);
    }
  }, [ledgerFetching, ledgerResponse?.pagination?.page, ledgerPage]);

  return (
    <div className="space-y-5">
      {/* ── Global stats (Admin only) ────────────────── */}
      {isAdmin(role) && (
        <>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 md:hidden">
            <div className="flex gap-2.5">
              {adminSummaryCards.map((card) => (
                <div
                  key={card.key}
                  className={`w-[148px] shrink-0 rounded-2xl border px-3 py-3 shadow-sm ${card.borderClass} ${card.bgClass}`}
                >
                  <p className={`line-clamp-2 text-[9px] font-black uppercase tracking-[0.12em] ${card.labelClass}`}>
                    {card.label}
                  </p>
                  <div className="mt-2 min-h-[24px]">
                    {globalSummaryLoading ? (
                      <InlineLoader label={t("paymentsPage.loading")} />
                    ) : (
                      <p className={`text-xl font-black ${card.textClass}`}>{card.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-3">
            {adminSummaryCards.map((card) => (
              <div
                key={card.key}
                className={`rounded-lg border p-3 ${card.borderClass} ${card.bgClass}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${card.labelClass}`}>
                  {card.label}
                </p>
                <div className="mt-1 min-h-[24px]">
                  {globalSummaryLoading ? (
                    <InlineLoader label={t("paymentsPage.loading")} />
                  ) : (
                    <p className={`text-lg font-extrabold ${card.textClass}`}>{card.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 grid max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex-1 min-w-0 space-y-4">
          {/* Mobile Filter Bar */}
          <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-slate-200/70 bg-white/90 px-4 py-2.5 backdrop-blur-md md:hidden">
            <div className={`grid gap-2 ${isAdmin(role) ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="relative inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm transition active:scale-[0.98]"
              >
                <Filter className="h-3 w-3" />
                {t("paymentsPage.filtersTitle", "Ledger Filters")}
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {isAdmin(role) && (
                <button
                  type="button"
                  onClick={() => setShowMobileBilling(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 shadow-sm transition active:scale-[0.98]"
                >
                  {t("paymentsPage.generateDuesTitle", "Monthly Billing")}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)]">
              <div className="border-b border-slate-100 bg-slate-50/50 p-3.5 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] md:tracking-[0.16em] text-slate-400">
                      {t("paymentsPage.ledgerKicker", "Ledger Snapshot")}
                    </p>
                    <h3 className="mt-1 text-[13px] md:text-sm font-extrabold text-slate-900">
                      {t("paymentsPage.ledgerTitle", "Payment Ledger")}
                    </h3>
                    <p className="mt-1.5 text-[11px] text-slate-500 md:hidden">
                      {t("paymentsPage.mobileLedgerHint", "Review student records, payment states, and collection actions in one place.")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] md:px-2.5 md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.12em] text-slate-500">
                      {ledgerScopeLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] md:px-2.5 md:text-[10px] font-bold text-slate-600">
                      {ledgerSummary.total} {t("paymentsPage.recordsLabel", "records")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-100 bg-white p-2.5 sm:p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <LedgerMetricCard label={t("paymentsPage.status.due", "Due")} value={ledgerSummary.due} tone="amber" />
                  <LedgerMetricCard label={t("paymentsPage.status.paid_online", "Paid Online")} value={ledgerSummary.paidOnline} tone="emerald" />
                  <LedgerMetricCard label={t("paymentsPage.status.paid_offline", "Paid Offline")} value={ledgerSummary.paidOffline} tone="sky" />
                  <LedgerMetricCard label={t("paymentsPage.status.waived", "Waived")} value={ledgerSummary.waived} tone="slate" />
                </div>
              </div>

              {error ? (
                <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] md:text-xs font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="relative min-h-[400px] bg-white">
                {ledgerLoading ? (
                  <div className="py-20"><ListSkeleton count={10} /></div>
                ) : (
                  <>
                    {ledgerFetching && ledgerPayments.length > 0 ? (
                      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {t("paymentsPage.loading", "Loading")}...
                      </div>
                    ) : null}

                    <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2 md:hidden">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {t("paymentsPage.mobileTableHint", "Swipe sideways to view the full ledger table")}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-collapse text-left md:min-w-[950px]">
                        <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100">
                          <tr>
                            <TH className="pl-4 md:pl-6">{t("paymentsPage.table.student", "Student")}</TH>
                            <TH>{t("paymentsPage.table.amount", "Amount")}</TH>
                            <TH>{t("paymentsPage.table.period", "Period")}</TH>
                            <TH>{t("paymentsPage.table.status", "Status")}</TH>
                            <TH>{t("paymentsPage.table.method", "Details")}</TH>
                            <TH className="pr-4 text-right md:pr-6">{t("paymentsPage.table.actions", "Actions")}</TH>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {ledgerPayments.map((payment) => (
                            <tr key={payment._id} className="group hover:bg-slate-50/80 transition-colors">
                              <TD className="pl-4 py-3 md:pl-6 md:py-4">
                                <p className="min-w-[140px] text-[11px] md:min-w-[160px] md:text-xs font-extrabold text-slate-900">{payment.student?.fullName || "N/A"}</p>
                                <p className="mt-0.5 text-[9px] md:text-[10px] font-medium text-slate-400">{payment.batch?.name || "N/A"}</p>
                              </TD>
                              <TD className="py-3 md:py-4 whitespace-nowrap">
                                <p className="text-[11px] md:text-xs font-black text-slate-900">{formatAmount(payment.amount, payment.currency || "BDT", language)}</p>
                              </TD>
                              <TD className="py-3 md:py-4 whitespace-nowrap">
                                <p className="text-[11px] md:text-xs font-bold text-slate-700">{getMonthName(payment.billingMonth, language)} {payment.billingYear}</p>
                                <p className="mt-0.5 text-[9px] md:text-[10px] text-slate-400 italic">{formatServiceMonth(payment.billingYear, payment.billingMonth)}</p>
                              </TD>
                              <TD className="py-3 md:py-4 whitespace-nowrap"><StatusPill status={payment.status} t={t} /></TD>
                              <TD className="py-3 md:py-4 text-[10px] md:text-[11px] whitespace-nowrap">
                                <span className="font-semibold text-slate-700">
                                  {payment.status === "due"
                                    ? t("paymentsPage.collectionPending", "Awaiting collection")
                                    : methodLabel(payment.paymentMethod)}
                                </span>
                                <p className="mt-1 text-[9px] md:text-[10px] text-slate-400 font-medium">
                                  {payment.status === "due"
                                    ? `${t("paymentsPage.dueOn", "Due on")}: ${formatDate(payment.dueDate)}`
                                    : `${t("paymentsPage.updatedOn", "Updated on")}: ${formatDate(payment.paidAt || payment.updatedAt)}`}
                                </p>
                                <p className="mt-1 text-[9px] md:text-[10px] text-slate-400 italic">
                                  {t("paymentsPage.coversLabel", "Covers")}: {formatServiceMonth(payment.billingYear, payment.billingMonth) || t("paymentsPage.notAvailable", "N/A")}
                                </p>
                              </TD>
                              <TD className="pr-4 py-3 text-right md:pr-6 md:py-4">
                                {payment.status === "due" && canUpdate ? (
                                  <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                    <button
                                      type="button"
                                      disabled={!!markingId}
                                      onClick={() => handleOfflineMark(payment._id)}
                                      className="site-button-primary whitespace-nowrap text-[9px] md:text-[10px] !px-2.5 md:!px-3 !py-1 md:!py-1.5"
                                    >
                                      {markingId === payment._id && !waiving ? t("paymentsPage.updating") : t("paymentsPage.markPaidOffline")}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!!markingId}
                                      onClick={() => handleWaive(payment._id)}
                                      className="site-button-danger whitespace-nowrap text-[9px] md:text-[10px] !px-2.5 md:!px-3 !py-1 md:!py-1.5"
                                    >
                                      {markingId === payment._id && waiving ? "Waiving..." : "Waive"}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-widest">—</span>
                                )}
                              </TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {ledgerPayments.length === 0 && (
                      <div className="py-20 text-center bg-white px-4">
                        <p className="text-[13px] md:text-sm font-bold text-slate-400">{t("paymentsPage.noBatchRecords", "No matching records found.")}</p>
                        <button
                          type="button"
                          onClick={resetLedgerFilters}
                          className="mt-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 underline"
                        >
                          {t("paymentsPage.resetFilters", "Reset All Filters")}
                        </button>
                      </div>
                    )}

                    {ledgerPayments.length > 0 && (
                      <div className="border-t border-slate-100 bg-white">
                        <PaginationControls
                          page={currentLedgerPage}
                          totalPages={totalLedgerPages}
                          onPrev={() => setLedgerPage((current) => Math.max(1, current - 1))}
                          onNext={() => setLedgerPage((current) => Math.min(totalLedgerPages, current + 1))}
                          disabled={ledgerFetching}
                          loading={ledgerFetching}
                          t={t}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {portalMounted
              ? createPortal(
                  <>
                    <AnimatePresence>
                      {showMobileFilters && (
                        <div className="md:hidden">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileFilters(false)}
                            className="fixed inset-0 z-[260] bg-slate-950/40 backdrop-blur-sm"
                          />
                          <div className="fixed inset-0 z-[270] flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: 12 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="site-panel flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 shadow-2xl"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                                <div>
                                  <h3 className="text-base font-black text-slate-900">Advanced Filters</h3>
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    {activeFilterCount > 0
                                      ? `${activeFilterCount} ${t("paymentsPage.activeFiltersLabel", "active filters")}`
                                      : t("paymentsPage.mobileFilterHint", "Refine the ledger results")}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowMobileFilters(false)}
                                  className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                <LedgerFiltersContent
                                  t={t}
                                  showSearch
                                  searchStudent={searchStudent}
                                  setSearchStudent={setSearchStudent}
                                  selectedBatchId={selectedBatchId}
                                  setSelectedBatchId={setSelectedBatchId}
                                  filterStatus={filterStatus}
                                  setFilterStatus={setFilterStatus}
                                  filterYear={filterYear}
                                  setFilterYear={setFilterYear}
                                  filterMonth={filterMonth}
                                  setFilterMonth={setFilterMonth}
                                  batches={batches}
                                  isAdmin={isAdmin}
                                  role={role}
                                  dynamicYears={dynamicYears}
                                  language={language}
                                />
                              </div>

                              <div className="border-t border-slate-100 bg-white px-4 py-3">
                                <div className={`grid gap-3 ${activeFilterCount > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
                                  {activeFilterCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={resetLedgerFilters}
                                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-100"
                                    >
                                      {t("paymentsPage.resetFilters", "Reset All Filters")}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full rounded-xl bg-emerald-600 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-200"
                                  >
                                    {t("paymentsPage.showResults", "Show Results")}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showMobileBilling && (
                        <div className="md:hidden">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileBilling(false)}
                            className="fixed inset-0 z-[260] bg-slate-950/40 backdrop-blur-sm"
                          />
                          <div className="fixed inset-0 z-[270] flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: 12 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="site-panel flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 shadow-2xl"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                                <div>
                                  <h3 className="text-base font-black text-slate-900">
                                    {t("paymentsPage.generateDuesTitle", "Monthly Billing")}
                                  </h3>
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    {t("paymentsPage.mobileBillingHint", "Generate dues for the selected month and batches")}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowMobileBilling(false)}
                                  className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                <MonthlyBillingForm
                                  t={t}
                                  language={language}
                                  dynamicYears={dynamicYears}
                                  dueYear={dueYear}
                                  setDueYear={setDueYear}
                                  dueMonth={dueMonth}
                                  setDueMonth={setDueMonth}
                                  dueBatchIds={dueBatchIds}
                                  setDueBatchIds={setDueBatchIds}
                                  batches={batches}
                                  generatingDues={generatingDues}
                                  handleGenerateDues={handleGenerateDues}
                                  compact
                                />
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </>,
                  document.body
                )
              : null}
          </div>
        </section>

        <aside className="hidden space-y-4 lg:block">
          {/* Filters Panel */}
          <div className="site-panel rounded-[clamp(8px,5%,12px)] p-4">
            <h3 className="text-xs font-extrabold text-slate-900">{t("paymentsPage.filtersTitle", "Ledger Filters")}</h3>
            <div className="mt-4">
              <LedgerFiltersContent
                t={t}
                searchStudent={searchStudent}
                setSearchStudent={setSearchStudent}
                selectedBatchId={selectedBatchId}
                setSelectedBatchId={setSelectedBatchId}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                filterMonth={filterMonth}
                setFilterMonth={setFilterMonth}
                batches={batches}
                isAdmin={isAdmin}
                role={role}
                dynamicYears={dynamicYears}
                language={language}
              />
            </div>
          </div>

          {/* Dues Generation (Admin only) */}
          {isAdmin(role) && (
            <div className="site-panel rounded-[clamp(8px,5%,12px)] p-4">
              <h3 className="text-xs font-extrabold text-slate-900">{t("paymentsPage.generateDuesTitle", "Monthly Billing")}</h3>
              <MonthlyBillingForm
                t={t}
                language={language}
                dynamicYears={dynamicYears}
                dueYear={dueYear}
                setDueYear={setDueYear}
                dueMonth={dueMonth}
                setDueMonth={setDueMonth}
                dueBatchIds={dueBatchIds}
                setDueBatchIds={setDueBatchIds}
                batches={batches}
                generatingDues={generatingDues}
                handleGenerateDues={handleGenerateDues}
              />
            </div>
          )}
        </aside>
      </div>
      {popupNode}
    </div>
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
      <section className="w-full max-w-[1600px] ml-0 mr-auto px-4 sm:px-6 lg:px-8 py-10">
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
