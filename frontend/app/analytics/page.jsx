"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import AdminAnalyticsPanel from "@/components/dashboard/AdminAnalyticsPanel";
import { selectIsAuthenticated, selectIsAuthInitialized, selectToken } from "@/lib/features/auth/authSlice";
import { useGetAdminAnalyticsQuery } from "@/lib/features/analytics/analyticsApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection } from "@/components/motion/MotionReveal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function AnalyticsPage() {
  const { t, language } = useSiteLanguage();
  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const [viewMode, setViewMode] = useState("overall");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportState, setReportState] = useState({
    activeKey: null,
    error: "",
  });
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear; year >= 2026; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const queryArgs =
    viewMode === "month"
      ? {
          billingYear: selectedYear,
          billingMonth: selectedMonth,
        }
      : undefined;

  const { data, isLoading, isFetching } = useGetAdminAnalyticsQuery(queryArgs, {
    skip: !isInitialized || !isAuthenticated,
  });

  const clearReportError = () => {
    setReportState((currentState) =>
      currentState.error
        ? {
            ...currentState,
            error: "",
          }
        : currentState
    );
  };

  const handleYearChange = (year) => {
    clearReportError();
    setSelectedYear(year);
  };

  const handleMonthChange = (month) => {
    clearReportError();
    setSelectedMonth(month);
  };

  const handleDownloadReport = async ({ reportType, reportVariant }) => {
    const activeKey = `${reportVariant}-${reportType}`;

    try {
      setReportState({
        activeKey,
        error: "",
      });

      const query = new URLSearchParams({
        reportType,
        reportVariant,
        billingYear: String(selectedYear),
      });

      if (reportType === "monthly") {
        query.set("billingMonth", String(selectedMonth));
      }

      const response = await fetch(`${API_BASE_URL}/analytics/admin-report?${query.toString()}`, {
        method: "GET",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.message || t("analyticsPage.reportGenerateFailed", "Failed to generate the analytics report."));
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const fileNameMatch = disposition?.match(/filename="?([^"]+)"?/i);
      const fileName =
        fileNameMatch?.[1] ||
        `${reportVariant}-${reportType}-${selectedYear}${
          reportType === "monthly" ? `-${String(selectedMonth).padStart(2, "0")}` : ""
        }.pdf`;

      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      setReportState({
        activeKey: null,
        error: "",
      });
    } catch (error) {
      setReportState({
        activeKey: null,
        error: error.message || t("analyticsPage.reportGenerateFailed", "Failed to generate the analytics report."),
      });
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="site-shell min-h-screen pb-14">
        <div className="container-page py-4 md:py-8">
          <RevealSection>
            <AdminAnalyticsPanel
              analytics={data?.data || null}
              loading={isLoading}
              refreshing={isFetching && !isLoading}
              language={language}
              t={t}
              viewMode={viewMode}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              yearOptions={yearOptions}
              onViewModeChange={setViewMode}
              onYearChange={handleYearChange}
              onMonthChange={handleMonthChange}
              onDownloadReport={handleDownloadReport}
              reportState={reportState}
            />
          </RevealSection>
        </div>
      </section>
    </RequireAuth>
  );
}
