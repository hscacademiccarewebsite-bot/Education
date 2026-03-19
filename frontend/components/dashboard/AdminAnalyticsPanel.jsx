"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

const ACCENT_STYLES = {
  emerald: "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-200/70 text-emerald-700",
  sky: "from-sky-500/15 via-sky-500/5 to-transparent border-sky-200/70 text-sky-700",
  indigo: "from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-200/70 text-indigo-700",
  amber: "from-amber-500/15 via-amber-500/5 to-transparent border-amber-200/70 text-amber-700",
  rose: "from-rose-500/15 via-rose-500/5 to-transparent border-rose-200/70 text-rose-700",
  slate: "from-slate-500/10 via-slate-500/5 to-transparent border-slate-200/70 text-slate-700",
};

const ROLE_META = {
  admin: { label: "Admin", color: "#0f766e" },
  teacher: { label: "Teacher", color: "#2563eb" },
  moderator: { label: "Moderator", color: "#7c3aed" },
  student: { label: "Student", color: "#f97316" },
};

const METHOD_META = {
  bkash: { label: "bKash", colorClass: "bg-emerald-500" },
  offline: { label: "Offline", colorClass: "bg-sky-500" },
  manual_adjustment: { label: "Manual Adj.", colorClass: "bg-slate-500" },
};

const ENROLLMENT_META = {
  pending: { label: "Pending", colorClass: "bg-amber-500" },
  approved: { label: "Approved", colorClass: "bg-emerald-500" },
  rejected: { label: "Rejected", colorClass: "bg-rose-500" },
};

const BATCH_META = {
  active: { label: "Active", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  upcoming: { label: "Upcoming", chip: "bg-sky-50 text-sky-700 border-sky-200" },
  archived: { label: "Archived", chip: "bg-slate-100 text-slate-700 border-slate-200" },
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  return {
    value: month,
    label: new Date(Date.UTC(2026, index, 1)).toLocaleDateString("en-US", {
      month: "long",
      timeZone: "UTC",
    }),
  };
});

const toLocale = (language) => (language === "bn" ? "bn-BD" : "en-US");

function formatNumber(value, language) {
  return new Intl.NumberFormat(toLocale(language)).format(Number(value || 0));
}

function formatCurrency(value, language, currency = "BDT") {
  return `${formatNumber(Math.round(Number(value || 0)), language)} ${currency}`;
}

function formatCompactAmount(value, language) {
  const numericValue = Number(value || 0);

  if (Math.abs(numericValue) < 1000) {
    return formatNumber(Math.round(numericValue), language);
  }

  return new Intl.NumberFormat(toLocale(language), {
    notation: "compact",
    maximumFractionDigits: Math.abs(numericValue) < 10000 ? 1 : 0,
  }).format(numericValue);
}

function formatPercent(value, language) {
  return `${new Intl.NumberFormat(toLocale(language), { maximumFractionDigits: 0 }).format(
    Number(value || 0)
  )}%`;
}

function SectionCard({ kicker, title, description, children, className = "" }) {
  return (
    <article
      className={`overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.4)] md:rounded-[24px] ${className}`}
    >
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.06),transparent_45%)] px-4 py-4 md:px-4 md:py-4">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-600 md:text-[9px]">{kicker}</p>
        <h3 className="mt-2 text-base font-extrabold tracking-tight text-slate-900 md:text-lg">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-[10px] leading-relaxed text-slate-500 md:text-[13px]">{description}</p>
        ) : null}
      </div>
      <div className="p-3.5 md:p-4">{children}</div>
    </article>
  );
}

function MetricCard({ label, value, hint, accent = "slate", className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border bg-gradient-to-br p-3.5 shadow-sm md:rounded-[22px] md:p-3.5 ${ACCENT_STYLES[accent] || ACCENT_STYLES.slate} ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/60" />
      <p className="text-[8px] font-black uppercase tracking-[0.16em] opacity-70 md:text-[9px]">{label}</p>
      <p className="mt-2.5 text-xl font-black tracking-tight text-slate-950 md:mt-2.5 md:text-[28px]">{value}</p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 md:mt-1.5 md:text-[10px]">{hint}</p>
    </div>
  );
}

function MiniStatCard({ label, value, hint, tone = "slate", className = "" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50/70 text-slate-900",
    amber: "border-amber-200 bg-amber-50/70 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
    rose: "border-rose-200 bg-rose-50/70 text-rose-900",
  };

  return (
    <div className={`rounded-[18px] border p-3 md:rounded-[20px] md:p-2.5 ${tones[tone] || tones.slate} ${className}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 md:text-[9px]">{label}</p>
      <p className="mt-1.5 text-lg font-black md:mt-1.5 md:text-[18px]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-slate-500 md:text-[10px]">{hint}</p> : null}
    </div>
  );
}

function LegendPill({ label, value, className = "" }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-bold md:px-2 md:py-0.5 md:text-[9px] ${className}`}
    >
      <span>{label}</span>
      <span className="text-slate-400">•</span>
      <span>{value}</span>
    </div>
  );
}

function FilterControls({
  t,
  viewMode,
  onViewModeChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  years,
  scopeLabel,
  refreshing,
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-sm md:rounded-[24px] md:p-3.5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400 md:text-[9px]">
            {t("dashboard.analytics.scopeKicker", "Analytics Scope")}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-slate-950 md:text-base">
            {t("dashboard.analytics.scopeTitle", "How should we read the finance data?")}
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 md:text-[10px]">
            {t(
              "dashboard.analytics.scopeDescription",
              "Switch between overall history and a specific billing month so collection and due numbers stay unambiguous."
            )}
          </p>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          <LegendPill
            label={t("dashboard.analytics.currentScope", "Current Scope")}
            value={scopeLabel}
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
          {refreshing ? (
            <LegendPill
              label={t("paymentsPage.loading", "Loading")}
              value={t("dashboard.analytics.refreshing", "Refreshing")}
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1 lg:inline-flex lg:w-auto">
          {[
            { key: "overall", label: t("dashboard.analytics.overallView", "Overall") },
            { key: "month", label: t("dashboard.analytics.monthView", "Billing Month") },
          ].map((option) => {
            const active = viewMode === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onViewModeChange(option.key)}
                className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition md:px-3 md:py-1.5 md:text-[9px] ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className={`grid w-full gap-3 sm:grid-cols-2 lg:w-auto ${viewMode === "month" ? "" : "opacity-60"}`}>
          <label className="grid gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 md:text-[9px]">
              {t("paymentsPage.billingYear", "Billing Year")}
            </span>
            <select
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              disabled={viewMode !== "month"}
              className="w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 disabled:cursor-not-allowed md:rounded-[18px] md:py-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 md:text-[9px]">
              {t("paymentsPage.billingMonth", "Billing Month")}
            </span>
            <select
              value={selectedMonth}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              disabled={viewMode !== "month"}
              className="w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 disabled:cursor-not-allowed md:rounded-[18px] md:py-2"
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function ReportDownloadPanel({
  t,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  years,
  onDownloadReport,
  reportState,
}) {
  const selectedMonthLabel =
    MONTH_OPTIONS.find((month) => Number(month.value) === Number(selectedMonth))?.label || String(selectedMonth || "");
  const activeReportKey = reportState?.activeKey || null;
  const reportError = reportState?.error || "";
  const reportButtons = [
    {
      key: "summary-monthly",
      title: t("dashboard.analytics.summaryMonthlyPdf", "Monthly Summary PDF"),
      description: t(
        "dashboard.analytics.summaryMonthlyPdfDescription",
        "Executive overview with KPIs, finance trend, payment mix, and batch performance."
      ),
      scopeLabel: `${selectedMonthLabel} ${selectedYear}`,
      reportType: "monthly",
      reportVariant: "summary",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      actionLabel: t("dashboard.analytics.generateMonthlySummaryPdf", "Generate Monthly Summary PDF"),
      loadingLabel: t("dashboard.analytics.generatingMonthlySummaryPdf", "Generating monthly summary..."),
    },
    {
      key: "summary-yearly",
      title: t("dashboard.analytics.summaryYearlyPdf", "Yearly Summary PDF"),
      description: t(
        "dashboard.analytics.summaryYearlyPdfDescription",
        "Annual operations report with month-by-month finance performance and platform health."
      ),
      scopeLabel: String(selectedYear),
      reportType: "yearly",
      reportVariant: "summary",
      className: "border-slate-200 bg-slate-900 text-white hover:bg-slate-800",
      actionLabel: t("dashboard.analytics.generateYearlySummaryPdf", "Generate Yearly Summary PDF"),
      loadingLabel: t("dashboard.analytics.generatingYearlySummaryPdf", "Generating yearly summary..."),
    },
    {
      key: "student-ledger-monthly",
      title: t("dashboard.analytics.studentMonthlyPdf", "Monthly Student Ledger"),
      description: t(
        "dashboard.analytics.studentMonthlyPdfDescription",
        "Course-wise monthly student payment detail with status, method, due date, and handled-by data."
      ),
      scopeLabel: `${selectedMonthLabel} ${selectedYear}`,
      reportType: "monthly",
      reportVariant: "student-ledger",
      className: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
      actionLabel: t("dashboard.analytics.generateMonthlyLedgerPdf", "Generate Monthly Student Ledger"),
      loadingLabel: t("dashboard.analytics.generatingMonthlyLedgerPdf", "Generating monthly ledger..."),
    },
    {
      key: "student-ledger-yearly",
      title: t("dashboard.analytics.studentYearlyPdf", "Yearly Student Ledger"),
      description: t(
        "dashboard.analytics.studentYearlyPdfDescription",
        "Annual course-wise student ledger covering every billing month in the selected year."
      ),
      scopeLabel: String(selectedYear),
      reportType: "yearly",
      reportVariant: "student-ledger",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
      actionLabel: t("dashboard.analytics.generateYearlyLedgerPdf", "Generate Yearly Student Ledger"),
      loadingLabel: t("dashboard.analytics.generatingYearlyLedgerPdf", "Generating yearly ledger..."),
    },
  ];

  return (
    <article className="mt-4 rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-sm md:rounded-[24px] md:p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400 md:text-[9px]">
            {t("dashboard.analytics.exportLibrary", "Export Library")}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-slate-950 md:text-base">
            {t("dashboard.analytics.exportLibraryTitle", "Download executive or detailed payment reports")}
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500 md:text-[10px]">
            {t(
              "dashboard.analytics.exportLibraryDescription",
              "Choose the billing month and year first, then generate either a summary PDF or a detailed student-ledger PDF."
            )}
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[390px]">
          <label className="grid gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 md:text-[9px]">
              {t("paymentsPage.billingYear", "Billing Year")}
            </span>
            <select
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 md:rounded-[18px] md:py-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400 md:text-[9px]">
              {t("paymentsPage.billingMonth", "Billing Month")}
            </span>
            <select
              value={selectedMonth}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className="w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 md:rounded-[18px] md:py-2"
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
        <LegendPill
          label={t("dashboard.analytics.monthlyReport", "Monthly PDF")}
          value={`${selectedMonthLabel} ${selectedYear}`}
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />
        <LegendPill
          label={t("dashboard.analytics.yearlyReport", "Yearly PDF")}
          value={String(selectedYear)}
          className="border-indigo-200 bg-indigo-50 text-indigo-700"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {reportButtons.map((button) => {
          const isActive = activeReportKey === button.key;
          return (
            <div key={button.key} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3 md:rounded-[20px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black text-slate-950 md:text-[12px]">{button.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{button.description}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                  {button.scopeLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onDownloadReport?.({
                    reportType: button.reportType,
                    reportVariant: button.reportVariant,
                  })
                }
                disabled={!onDownloadReport || Boolean(activeReportKey)}
                className={`mt-3 inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${button.className}`}
              >
                {isActive ? button.loadingLabel : button.actionLabel}
              </button>
            </div>
          );
        })}
      </div>

      {reportError ? (
        <p className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          {reportError}
        </p>
      ) : null}
    </article>
  );
}

function DonutChart({ items, total, centerLabel, centerValue, language }) {
  const normalizedItems = items.filter((item) => item.value > 0);
  let cursor = 0;
  const background = normalizedItems.length
    ? `conic-gradient(${normalizedItems
        .map((item) => {
          const start = cursor;
          const sweep = (item.value / total) * 360;
          cursor += sweep;
          return `${item.color} ${start}deg ${cursor}deg`;
        })
        .join(", ")})`
    : "conic-gradient(#e2e8f0 0deg 360deg)";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="mx-auto flex shrink-0 items-center justify-center lg:mx-0">
        <div className="relative h-32 w-32 rounded-full p-3 sm:h-36 sm:w-36 md:h-40 md:w-40 md:p-3.5" style={{ background }}>
          <div className="absolute inset-4 rounded-full bg-white shadow-[0_10px_30px_-25px_rgba(15,23,42,0.35)] md:inset-[18px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 md:text-[10px]">{centerLabel}</p>
            <p className="mt-1.5 text-xl font-black tracking-tight text-slate-950 md:mt-1.5 md:text-[28px]">{centerValue}</p>
            <p className="mt-1 text-[10px] text-slate-500 md:text-[10px]">{formatNumber(total, language)}</p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-1 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3 md:rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-[13px] font-bold text-slate-800 md:text-[13px]">{item.label}</p>
              </div>
              <p className="text-[13px] font-black text-slate-900 md:text-[13px]">{formatNumber(item.value, language)}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ items, currency, language, t }) {
  const maxValue = Math.max(
    1,
    ...items.flatMap((item) => [Number(item.collectedAmount || 0), Number(item.dueAmount || 0)])
  );

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
        <LegendPill
          label={t("dashboard.analytics.collected", "Collected")}
          value={t("dashboard.analytics.paidState", "Paid")}
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />
        <LegendPill
          label={t("dashboard.analytics.outstanding", "Outstanding")}
          value={t("dashboard.analytics.dueState", "Due")}
          className="border-amber-200 bg-amber-50 text-amber-700"
        />
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-max snap-x snap-mandatory gap-3 md:grid md:min-w-[500px] md:grid-cols-6 md:gap-3">
            {items.map((item) => {
              const collectedValue = Number(item.collectedAmount || 0);
              const dueValue = Number(item.dueAmount || 0);

              return (
                <div key={item.key} className="flex min-w-[98px] snap-start flex-col justify-end gap-2 md:min-w-0 md:gap-2.5">
                  <div className="relative flex h-52 items-end justify-center gap-3 rounded-[20px] border border-slate-100 bg-slate-50/70 px-2.5 pb-3 pt-10 md:h-64 md:gap-3 md:rounded-[20px] md:px-2.5">
                    <div className="absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-1.5 md:inset-x-2.5 md:top-2.5 md:gap-1.5">
                      <span
                        className="inline-flex max-w-[calc(50%-0.1875rem)] items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/95 px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.08em] text-emerald-700 shadow-sm md:px-1 md:py-0.5 md:text-[7px]"
                        title={`${t("dashboard.analytics.collected", "Collected")}: ${formatCurrency(
                          collectedValue,
                          language,
                          currency
                        )}`}
                      >
                        <span>C</span>
                        <span className="truncate">{formatCompactAmount(collectedValue, language)}</span>
                      </span>
                      <span
                        className="inline-flex max-w-[calc(50%-0.1875rem)] items-center gap-1 rounded-full border border-amber-200 bg-amber-50/95 px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.08em] text-amber-700 shadow-sm md:px-1 md:py-0.5 md:text-[7px]"
                        title={`${t("dashboard.analytics.outstanding", "Outstanding")}: ${formatCurrency(
                          dueValue,
                          language,
                          currency
                        )}`}
                      >
                        <span>D</span>
                        <span className="truncate">{formatCompactAmount(dueValue, language)}</span>
                      </span>
                    </div>
                    {[
                      {
                        key: "collected",
                        short: "C",
                        value: collectedValue,
                        barClass: "bg-emerald-500 shadow-[0_12px_18px_-10px_rgba(16,185,129,0.75)]",
                        textClass: "text-emerald-600",
                      },
                      {
                        key: "due",
                        short: "D",
                        value: dueValue,
                        barClass: "bg-amber-400 shadow-[0_12px_18px_-10px_rgba(245,158,11,0.7)]",
                        textClass: "text-amber-600",
                      },
                    ].map((bar) => (
                      <div key={bar.key} className="flex h-full flex-col items-center justify-end">
                        <div className="flex h-full items-end">
                          <div
                            className={`w-4 rounded-full transition-[height] duration-500 md:w-[18px] ${bar.barClass}`}
                            style={{
                              height: `${Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 10 : 0)}%`,
                            }}
                          />
                        </div>
                        <span className={`mt-2 text-[8px] font-black uppercase tracking-[0.12em] md:text-[8px] ${bar.textClass}`}>
                          {bar.short}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 md:text-[9px]">
                      {item.label.split(" ")[0]}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function EnrollmentPipeline({ enrollments, language, t }) {
  const total = Math.max(enrollments.total || 0, 1);
  const segments = [
    { key: "pending", value: enrollments.pending || 0, meta: ENROLLMENT_META.pending },
    { key: "approved", value: enrollments.approved || 0, meta: ENROLLMENT_META.approved },
    { key: "rejected", value: enrollments.rejected || 0, meta: ENROLLMENT_META.rejected },
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className="flex h-4 w-full">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={segment.meta.colorClass}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {segments.map((segment) => (
          <div key={segment.key} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-2.5 md:rounded-2xl md:p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 md:text-[9px]">{segment.meta.label}</p>
            <p className="mt-1.5 text-base font-black text-slate-950 md:mt-2 md:text-xl">{formatNumber(segment.value, language)}</p>
            <p className="mt-1 text-[10px] text-slate-500 md:text-[11px]">
              {formatPercent((segment.value / total) * 100, language)} {t("dashboard.analytics.ofPipeline", "of pipeline")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareList({ items, totalAmount, currency, language }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm md:rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${item.meta.colorClass}`} />
              <div>
                <p className="text-[13px] font-bold text-slate-900 md:text-sm">{item.meta.label}</p>
                <p className="text-[10px] text-slate-500 md:text-[11px]">{formatNumber(item.count, language)} records</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-black text-slate-950 md:text-sm">{formatCurrency(item.amount, language, currency)}</p>
              <p className="text-[10px] text-slate-500 md:text-[11px]">
                {formatPercent(totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0, language)}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${item.meta.colorClass}`}
              style={{ width: `${totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BatchPerformanceMatrix({ items, leaders, currency, language, t, scopeLabel }) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);

  const filteredItems = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => String(item.name || "").toLowerCase().includes(normalized));
  }, [items, deferredSearch]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
        {t("dashboard.analytics.noBatchData", "No batch payment data is available yet.")}
      </div>
    );
  }

  const strongestCollectionRate =
    leaders?.strongestCollectionRate && Number(leaders.strongestCollectionRate.collectionRate || 0) > 0
      ? leaders.strongestCollectionRate
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <MiniStatCard
          label={t("dashboard.analytics.bestCollectionBatch", "Best Collection")}
          value={leaders?.highestCollection?.name || t("paymentsPage.notAvailable", "N/A")}
          hint={
            leaders?.highestCollection
              ? formatCurrency(leaders.highestCollection.collectedAmount || 0, language, currency)
              : t("dashboard.analytics.noBatchLeader", "No collected batch yet")
          }
          tone="emerald"
        />
        <MiniStatCard
          label={t("dashboard.analytics.highestOutstandingBatch", "Highest Outstanding")}
          value={leaders?.highestOutstanding?.name || t("paymentsPage.notAvailable", "N/A")}
          hint={
            leaders?.highestOutstanding
              ? formatCurrency(leaders.highestOutstanding.dueAmount || 0, language, currency)
              : t("dashboard.analytics.noOutstandingBatch", "No batch is carrying dues")
          }
          tone="amber"
        />
        <MiniStatCard
          label={t("dashboard.analytics.strongestCollectionRate", "Strongest Rate")}
          value={strongestCollectionRate?.name || t("paymentsPage.notAvailable", "N/A")}
          hint={
            strongestCollectionRate
              ? formatPercent(strongestCollectionRate.collectionRate || 0, language)
              : t("dashboard.analytics.noRateData", "No rate data yet")
          }
          tone="slate"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          <LegendPill
            label={t("dashboard.analytics.currentScope", "Current Scope")}
            value={scopeLabel}
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
          <LegendPill
            label={t("dashboard.analytics.totalBatches", "Batches")}
            value={formatNumber(items.length, language)}
            className="border-indigo-200 bg-indigo-50 text-indigo-700"
          />
          <LegendPill
            label={t("dashboard.analytics.visibleRows", "Visible")}
            value={formatNumber(filteredItems.length, language)}
            className="border-sky-200 bg-sky-50 text-sky-700"
          />
        </div>

        <label className="block w-full lg:w-auto">
          <span className="sr-only">{t("dashboard.analytics.searchBatch", "Search batch")}</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("dashboard.analytics.searchBatchPlaceholder", "Search batch name")}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 md:rounded-2xl lg:w-[260px]"
          />
        </label>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredItems.map((item) => {
          const statusMeta = BATCH_META[item.status] || BATCH_META.archived;
          const collectibleBase = Math.max(
            Number(item.collectibleAmount || 0),
            Number(item.collectedAmount || 0) + Number(item.dueAmount || 0),
            1
          );
          const collectedWidth = Math.max((Number(item.collectedAmount || 0) / collectibleBase) * 100, 0);
          const dueWidth = Math.max((Number(item.dueAmount || 0) / collectibleBase) * 100, 0);
          return (
            <div key={item.batchId || item.name} className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{item.name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {formatNumber(item.studentCount, language)} {t("dashboard.analytics.students", "students")} •{" "}
                    {formatNumber(item.records, language)} {t("dashboard.analytics.records", "records")}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${statusMeta.chip}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <LegendPill
                  label={t("dashboard.analytics.monthlyFee", "Monthly Fee")}
                  value={formatCurrency(item.monthlyFee, language, item.currency || currency)}
                  className="border-slate-200 bg-slate-50 text-slate-700"
                />
                <LegendPill
                  label={t("dashboard.analytics.collectionRate", "Collection Rate")}
                  value={formatPercent(item.collectionRate, language)}
                  className="border-indigo-200 bg-indigo-50 text-indigo-700"
                />
              </div>

              <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {t("dashboard.analytics.collectionHealth", "Collection Health")}
                  </p>
                  <p className="text-[11px] font-black text-slate-900">
                    {formatCurrency(item.collectibleAmount || 0, language, currency)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full rounded-l-full bg-emerald-500"
                      style={{ width: `${collectedWidth}%` }}
                    />
                    <div
                      className="h-full rounded-r-full bg-amber-400"
                      style={{ width: `${dueWidth}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {t("dashboard.analytics.collected", "Collected")}
                    </p>
                    <p className="mt-1 text-sm font-black text-emerald-700">
                      {formatCurrency(item.collectedAmount, language, currency)}
                    </p>
                    <p className="mt-1 text-[10px] text-emerald-800/70">
                      {formatNumber(item.paidCount, language)} {t("dashboard.analytics.paidRecords", "paid")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-700">
                      {t("dashboard.analytics.outstanding", "Outstanding")}
                    </p>
                    <p className="mt-1 text-sm font-black text-amber-700">
                      {formatCurrency(item.dueAmount, language, currency)}
                    </p>
                    <p className="mt-1 text-[10px] text-amber-800/70">
                      {formatNumber(item.dueCount, language)} {t("dashboard.analytics.dueRecords", "due")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-2.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-rose-700">
                      {t("dashboard.analytics.overdueDues", "Overdue")}
                    </p>
                    <p className="mt-1 text-sm font-black text-rose-700">
                      {formatCurrency(item.overdueAmount, language, currency)}
                    </p>
                    <p className="mt-1 text-[10px] text-rose-800/70">
                      {formatNumber(item.overdueCount, language)} {t("dashboard.analytics.recordsNeedFollowup", "follow-up")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.batch", "Batch")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.status", "Status")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.students", "Students")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.records", "Records")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.monthlyFee", "Monthly Fee")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.collected", "Collected")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.outstanding", "Outstanding")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.overdueDues", "Overdue")}</th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t("dashboard.analytics.collectionRate", "Collection Rate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredItems.map((item) => {
              const statusMeta = BATCH_META[item.status] || BATCH_META.archived;
              return (
                <tr key={item.batchId || item.name}>
                  <td className="px-3 py-4">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${statusMeta.chip}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-600">{formatNumber(item.studentCount, language)}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-600">{formatNumber(item.records, language)}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-600">{formatCurrency(item.monthlyFee, language, item.currency || currency)}</td>
                  <td className="px-3 py-4 text-sm font-black text-emerald-700">{formatCurrency(item.collectedAmount, language, currency)}</td>
                  <td className="px-3 py-4 text-sm font-black text-amber-700">{formatCurrency(item.dueAmount, language, currency)}</td>
                  <td className="px-3 py-4 text-sm font-black text-rose-700">{formatCurrency(item.overdueAmount, language, currency)}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900">{formatPercent(item.collectionRate, language)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-[120px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100/80" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
        <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[290px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
        <div className="h-[290px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
      </div>
      <div className="h-[420px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100/80" />
    </div>
  );
}

export default function AdminAnalyticsPanel({
  analytics,
  loading,
  refreshing = false,
  language,
  t,
  viewMode = "overall",
  selectedYear,
  selectedMonth,
  yearOptions = [],
  onViewModeChange,
  onYearChange,
  onMonthChange,
  onDownloadReport,
  reportState = {},
}) {
  if (loading && !analytics) {
    return <LoadingSkeleton />;
  }

  const data = analytics || {};
  const users = data.users || {};
  const batches = data.batches || {};
  const enrollments = data.enrollments || {};
  const payments = data.payments || {};
  const filters = data.filters || {};
  const currency = data.currency || "BDT";
  const paymentScopeLabel = payments.period?.label || filters.label || t("dashboard.analytics.overallView", "Overall");
  const overallPayments = payments.overall || payments;
  const generatedAt = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString(toLocale(language))
    : null;

  const staffAccounts =
    (users.roleBreakdown || []).reduce(
      (sum, item) => sum + (item.key === "student" ? 0 : Number(item.count || 0)),
      0
    );

  const roleItems = (users.roleBreakdown || []).map((item) => ({
    key: item.key,
    label: ROLE_META[item.key]?.label || item.key,
    value: Number(item.count || 0),
    color: ROLE_META[item.key]?.color || "#94a3b8",
  }));

  const methodItems = (payments.methodBreakdown || []).map((item) => ({
    ...item,
    meta: METHOD_META[item.key] || METHOD_META.manual_adjustment,
  }));
  const totalMethodAmount = methodItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const quickLinks = [
    { href: "/payments", label: t("dashboard.analytics.openPayments", "Open payments") },
    { href: "/users", label: t("dashboard.analytics.openUsers", "Open users") },
    { href: "/enrollments", label: t("dashboard.analytics.openEnrollments", "Open enrollments") },
    { href: "/courses", label: t("dashboard.analytics.openCourses", "Open courses") },
  ];

  const batchPerformance = payments.batchPerformance || {};

  return (
    <section className="mt-14 md:mt-14">
      <div className="mb-5 rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.45)] md:mb-6 md:rounded-[24px] md:p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-teal-600 md:text-[9px]">
              {t("dashboard.analytics.kicker", "Admin Analytics")}
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 md:text-[30px]">
              {t("dashboard.analytics.title", "Website operations at a glance")}
            </h2>
            <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-500 md:text-[13px]">
              {t(
                "dashboard.analytics.subtitle",
                "Track accounts, finances, enrollments, and batch performance from one admin-only control center."
              )}
            </p>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:px-2.5 md:py-1 md:text-[9px]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <LegendPill
            label={t("dashboard.analytics.currentScope", "Current Scope")}
            value={paymentScopeLabel}
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
          <LegendPill
            label={t("dashboard.analytics.totalAccounts", "Total Accounts")}
            value={formatNumber(users.total || 0, language)}
            className="border-indigo-200 bg-indigo-50 text-indigo-700"
          />
          <LegendPill
            label={t("dashboard.analytics.paymentRecords", "Payment Records")}
            value={formatNumber(payments.records || 0, language)}
            className="border-sky-200 bg-sky-50 text-sky-700"
          />
        </div>
        {generatedAt ? (
          <p className="mt-3 text-[10px] text-slate-500 md:text-[10px]">
            {t("dashboard.analytics.generatedAt", "Snapshot generated at")} {generatedAt}
          </p>
        ) : null}

      </div>

      <FilterControls
        t={t}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        years={yearOptions}
        scopeLabel={paymentScopeLabel}
        refreshing={refreshing}
      />

      <ReportDownloadPanel
        t={t}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        years={yearOptions}
        onDownloadReport={onDownloadReport}
        reportState={reportState}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 md:gap-3 xl:grid-cols-4">
        <MetricCard
          label={t("dashboard.analytics.totalAccounts", "Total Accounts")}
          value={formatNumber(users.total || 0, language)}
          hint={t("dashboard.analytics.accountsHint", "All registered accounts across the platform.")}
          accent="indigo"
        />
        <MetricCard
          label={t("dashboard.analytics.activeAccounts", "Active Accounts")}
          value={formatNumber(users.active || 0, language)}
          hint={`${formatNumber(users.newLast30Days || 0, language)} ${t("dashboard.analytics.newLast30Days", "new in the last 30 days")}`}
          accent="emerald"
        />
        <MetricCard
          label={t("dashboard.analytics.collectedRevenue", "Collected Revenue")}
          value={formatCurrency(payments.collectedAmount || 0, language, currency)}
          hint={`${paymentScopeLabel} • ${formatPercent(payments.collectionRate || 0, language)} ${t("dashboard.analytics.collectionRate", "collection rate")}`}
          accent="sky"
        />
        <MetricCard
          label={t("dashboard.analytics.outstandingDues", "Outstanding Dues")}
          value={formatCurrency(payments.dueAmount || 0, language, currency)}
          hint={`${paymentScopeLabel} • ${formatNumber(payments.overdueCount || 0, language)} ${t("dashboard.analytics.overdueRecords", "overdue records")}`}
          accent="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniStatCard
          label={t("dashboard.analytics.collectibleAmount", "Collectible Amount")}
          value={formatCurrency(payments.collectibleAmount || 0, language, currency)}
          hint={paymentScopeLabel}
          tone="slate"
        />
        <MiniStatCard
          label={t("dashboard.analytics.paidRecords", "Paid Records")}
          value={formatNumber(payments.paidCount || 0, language)}
          hint={`${formatPercent(payments.collectionRateByCount || 0, language)} ${t("dashboard.analytics.byCount", "by count")}`}
          tone="emerald"
        />
        <MiniStatCard
          label={t("dashboard.analytics.dueRecords", "Due Records")}
          value={formatNumber(payments.dueCount || 0, language)}
          hint={`${formatPercent(payments.outstandingRate || 0, language)} ${t("dashboard.analytics.ofCollectible", "of collectible value")}`}
          tone="amber"
        />
        <MiniStatCard
          label={t("dashboard.analytics.waivedAmount", "Waived Amount")}
          value={formatCurrency(payments.waivedAmount || 0, language, currency)}
          hint={`${formatCurrency(overallPayments.waivedAmount || 0, language, currency)} ${t("dashboard.analytics.overallReference", "overall")}`}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-3 md:gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          kicker={t("dashboard.analytics.finance", "Finance Trend")}
          title={t("dashboard.analytics.financeTitle", "Collections vs outstanding dues")}
          description={t(
            "dashboard.analytics.financeDescription",
            "Compare recent billing cycles to see where cash is being realized and where due balances continue to sit."
          )}
        >
          <TrendChart items={payments.monthlyTrend || []} currency={currency} language={language} t={t} />
        </SectionCard>

        <SectionCard
          kicker={t("dashboard.analytics.accounts", "Account Mix")}
          title={t("dashboard.analytics.accountMixTitle", "Role distribution")}
          description={t(
            "dashboard.analytics.accountMixDescription",
            "Keep an eye on how the platform is split between students and internal operating roles."
          )}
        >
          <DonutChart
            items={roleItems}
            total={Math.max(users.total || 0, 1)}
            centerLabel={t("dashboard.analytics.accountsCenter", "Accounts")}
            centerValue={formatNumber(users.total || 0, language)}
            language={language}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <LegendPill
              label={t("dashboard.analytics.staffAccounts", "Staff Accounts")}
              value={formatNumber(staffAccounts, language)}
              className="border-slate-200 bg-slate-50 text-slate-700"
            />
            <LegendPill
              label={t("dashboard.analytics.recentLogins", "Recent Logins")}
              value={formatNumber(users.recentLoginsLast7Days || 0, language)}
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            />
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-3 md:gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard
          kicker={t("dashboard.analytics.admissions", "Admissions Flow")}
          title={t("dashboard.analytics.pipelineTitle", "Enrollment pipeline")}
          description={t(
            "dashboard.analytics.pipelineDescription",
            "This is where you can judge review pressure, approval velocity, and whether the admissions queue is growing."
          )}
        >
          <EnrollmentPipeline enrollments={enrollments} language={language} t={t} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStatCard
              label={t("dashboard.analytics.approvalRate", "Approval Rate")}
              value={formatPercent(enrollments.approvalRate || 0, language)}
              hint={t("dashboard.analytics.approvalRateHint", "Based on approved vs rejected decisions")}
              tone="emerald"
            />
            <MiniStatCard
              label={t("dashboard.analytics.recentApplications", "Recent Applications")}
              value={formatNumber(enrollments.recentLast30Days || 0, language)}
              hint={t("dashboard.analytics.recentApplicationsHint", "Requests created in the last 30 days")}
              tone="slate"
            />
          </div>
        </SectionCard>

        <SectionCard
          kicker={t("dashboard.analytics.payments", "Payment Channels")}
          title={t("dashboard.analytics.channelsTitle", "Collection channel mix")}
          description={t(
            "dashboard.analytics.channelsDescription",
            "See how collections are being processed across bKash, offline settlements, and manual adjustments for the active scope."
          )}
        >
          <ShareList items={methodItems} totalAmount={totalMethodAmount} currency={currency} language={language} />
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-3 md:gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <SectionCard
          kicker={t("dashboard.analytics.operations", "Operations Snapshot")}
          title={t("dashboard.analytics.snapshotTitle", "What needs attention")}
          description={t(
            "dashboard.analytics.snapshotDescription",
            "These are the numbers that usually matter most day to day when an admin is checking platform health."
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard
              label={t("dashboard.analytics.totalBatches", "Total Batches")}
              value={formatNumber(batches.total || 0, language)}
              hint={`${formatNumber(batches.active || 0, language)} ${t("dashboard.analytics.activeBatches", "active")}`}
              tone="slate"
            />
            <MiniStatCard
              label={t("dashboard.analytics.paymentRecords", "Payment Records")}
              value={formatNumber(payments.records || 0, language)}
              hint={`${paymentScopeLabel} • ${formatCurrency(payments.grossAmount || 0, language, currency)}`}
              tone="slate"
            />
            <MiniStatCard
              label={t("dashboard.analytics.pendingReviews", "Pending Reviews")}
              value={formatNumber(enrollments.pending || 0, language)}
              hint={t("dashboard.analytics.reviewQueueHint", "Requests waiting for a decision")}
              tone="amber"
            />
            <MiniStatCard
              label={t("dashboard.analytics.overdueDues", "Overdue Dues")}
              value={formatCurrency(payments.overdueAmount || 0, language, currency)}
              hint={`${formatNumber(payments.overdueCount || 0, language)} ${t("dashboard.analytics.recordsNeedFollowup", "records need follow-up")}`}
              tone="rose"
            />
          </div>
        </SectionCard>

        <SectionCard
          kicker={t("dashboard.analytics.batchPerformance", "Batch Performance")}
          title={t("dashboard.analytics.batchPerformanceTitle", "Batch collection matrix")}
          description={t(
            "dashboard.analytics.batchPerformanceDescription",
            "Review every batch for the active scope, compare collected vs outstanding amounts, and identify where follow-up is needed."
          )}
        >
          <BatchPerformanceMatrix
            items={batchPerformance.items || []}
            leaders={batchPerformance}
            currency={currency}
            language={language}
            t={t}
            scopeLabel={paymentScopeLabel}
          />
        </SectionCard>
      </div>
    </section>
  );
}
