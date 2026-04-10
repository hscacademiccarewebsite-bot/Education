"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowUpRight, BriefcaseBusiness, BookOpen, CalendarDays,
  CreditCard, Facebook, GraduationCap, Link2, Mail, Phone,
  RefreshCcw, School, ShieldCheck, Users,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import AcademicStatusTag from "@/components/AcademicStatusTag";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import Avatar from "@/components/Avatar";
import { useKickOutEnrollmentMutation } from "@/lib/features/enrollment/enrollmentApi";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { useGetUserDetailsQuery } from "@/lib/features/user/userApi";
import { ROLES, getUserDisplayRoleLabel, getVisibleAcademicTag } from "@/lib/utils/roleUtils";
import { selectCurrentUser, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

// ===== UTILITY FUNCTIONS =====
const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatDateTime = (value, t, language) => {
  if (!value) return t?.("userDetails.misc.na", "N/A") || "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t?.("userDetails.misc.na", "N/A") || "N/A"
    : date.toLocaleString(language === "bn" ? "bn-BD" : "en-US");
};

const formatDate = (value, t, language) => {
  if (!value) return t?.("userDetails.misc.na", "N/A") || "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t?.("userDetails.misc.na", "N/A") || "N/A"
    : date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US");
};

const formatAmount = (value, language, currency = "BDT") => {
  const num = Number(value || 0);
  const formatted = new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(num);
  return `${formatted} ${currency}`;
};

const getLinkProps = (href = "") => {
  if (!href) return {};
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return { href, target: "_blank", rel: "noreferrer" };
  }
  return { href };
};

const resolveFacebookHref = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  return `https://facebook.com/${normalized.replace(/^\/+/, "")}`;
};

const getStatusStyles = (status) => {
  const styles = {
    approved: { bg: "bg-emerald-100", text: "text-emerald-700", accent: "bg-emerald-400" },
    rejected: { bg: "bg-rose-100", text: "text-rose-700", accent: "bg-rose-400" },
    kicked_out: { bg: "bg-slate-200", text: "text-slate-700", accent: "bg-slate-400" },
    default: { bg: "bg-amber-100", text: "text-amber-700", accent: "bg-amber-400" },
  };
  return styles[status] || styles.default;
};

const getPaymentStyles = (status) => {
  if (["paid_online", "paid_offline"].includes(status)) {
    return { bg: "bg-emerald-100", text: "text-emerald-700", accent: "bg-emerald-400" };
  }
  if (status === "waived") {
    return { bg: "bg-cyan-100", text: "text-cyan-700", accent: "bg-cyan-400" };
  }
  return { bg: "bg-amber-100", text: "text-amber-700", accent: "bg-amber-400" };
};

// ===== CUSTOM HOOK FOR DATA =====
function useUserDetails(userId) {
  const { t, language } = useSiteLanguage();
  const currentRole = useSelector(selectCurrentUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthInitialized = useSelector(selectIsAuthInitialized);
  const authReady = isAuthInitialized && isAuthenticated && Boolean(currentUser?._id);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetUserDetailsQuery(userId, {
    skip: !userId || !authReady,
    refetchOnMountOrArgChange: true,
  });

  // Extract data - use response directly, it will be undefined until loaded
  const payload = response?.data;
  const hasData = Boolean(payload?.user?._id);

  return {
    user: payload?.user || null,
    summary: payload?.summary || {},
    enrollments: payload?.enrollmentRequests || [],
    payments: payload?.payments || [],
    isPageLoading: isLoading || (!hasData && isFetching),
    isError,
    error,
    refetch,
    authReady,
    canKickOut: currentRole === ROLES.ADMIN || currentRole === ROLES.MODERATOR,
    canOpenUserList: currentRole === ROLES.ADMIN,
    t,
    language,
    currentRole,
  };
}

// ===== SUB-COMPONENTS =====
function MetricCard({ icon: Icon, label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white",
    emerald: "border-[var(--action-soft-border)] bg-[var(--action-soft-bg)]",
    cyan: "border-[var(--action-soft-border)] bg-[var(--action-soft-bg)]",
    amber: "border-[var(--action-soft-border)] bg-[var(--action-soft-bg)]",
  };

  return (
    <article className={cn("rounded-[18px] border p-2.5 shadow-sm", tones[tone])}>
      <div className="flex items-center justify-between gap-2.5">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-[14px] bg-white text-[var(--page-teal)] shadow-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
        </div>
      </div>
      <p className="mt-2 text-[17px] font-black tracking-tight text-slate-950 md:text-[19px]">{value}</p>
      {helper && <p className="mt-1 text-[11px] leading-[18px] text-slate-500 md:text-[12px]">{helper}</p>}
    </article>
  );
}

function SectionCard({ kicker, title, description, count, children }) {
  return (
    <section className="site-panel rounded-[20px] p-3 md:rounded-[24px] md:p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          {kicker && <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{kicker}</p>}
          <h2 className="mt-1 text-[15px] font-black tracking-tight text-slate-950 md:text-[17px]">{title}</h2>
          {description && <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-500 md:text-[13px] md:leading-[22px]">{description}</p>}
        </div>
        {count !== undefined && (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700">
            {count}
          </div>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoField({ icon: Icon, label, value, href, breakAll }) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? getLinkProps(href) : {};

  return (
    <Wrapper {...wrapperProps} className={cn(
      "group rounded-[16px] border border-slate-200 bg-slate-50/75 p-2.5 transition",
      href && "hover:border-[var(--action-soft-border)] hover:bg-white hover:shadow-sm"
    )}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--page-teal)] shadow-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className={cn("mt-1 text-[12px] font-semibold leading-5 text-slate-900 md:text-[13px]", breakAll ? "break-all" : "break-words")}>
            {value}
          </p>
        </div>
        {href && (
          <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:text-[var(--page-teal)] sm:flex">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[13px] text-slate-500 md:text-sm">
      {message}
    </div>
  );
}

function EnrollmentRecord({ item, canKickOut, kickingOutEnrollmentId, onKickOut, t, language }) {
  const styles = getStatusStyles(item.status);
  const statusReason = item.status === "kicked_out" ? item.kickoutReason : item.rejectionReason;

  return (
    <article className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/75 p-3.5">
      <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r", styles.accent)} />
      <div className="pl-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[14px] font-black tracking-tight text-slate-950 md:text-[15px]">
              {item.batch?.name || t("userDetails.misc.unknownCourse", "Unknown course")}
            </p>
            <div className="mt-1.5 space-y-1 text-[13px] text-slate-600 md:text-sm">
              <p>{t("userDetails.misc.applied", "Applied")}: {formatDateTime(item.createdAt, t, language)}</p>
              <p>{t("userDetails.misc.reviewed", "Reviewed")}: {formatDateTime(item.reviewedAt, t, language)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em]", styles.bg, styles.text)}>
              {t(`enrollmentsPage.status.${item.status}`, item.status)}
            </span>
            {canKickOut && item.status === "approved" && (
              <button
                type="button"
                onClick={() => onKickOut(item)}
                disabled={kickingOutEnrollmentId === item._id}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {kickingOutEnrollmentId === item._id
                  ? t("userDetails.actions.processing", "Processing...")
                  : t("userDetails.actions.kickOut", "Kick Out")}
              </button>
            )}
          </div>
        </div>

        {statusReason && (
          <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50/80 px-3 py-2 text-[13px] text-rose-700 md:text-sm">
            {t("userDetails.misc.reason", "Reason")}: {statusReason}
          </div>
        )}
      </div>
    </article>
  );
}

function PaymentRecord({ item, t, language }) {
  const styles = getPaymentStyles(item.status);
  const coveredMonth = new Date(Date.UTC(item.billingYear, item.billingMonth - 2, 1))
    .toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { month: "short", year: "numeric" });

  return (
    <article className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/75 p-3.5">
      <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r", styles.accent)} />
      <div className="pl-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[14px] font-black tracking-tight text-slate-950 md:text-[15px]">
              {item.batch?.name || t("userDetails.misc.unknownCourse", "Unknown course")}
            </p>
            <div className="mt-1.5 space-y-1 text-[13px] text-slate-600 md:text-sm">
              <p>{t("userDetails.misc.cycle", "Cycle")}: {item.billingMonth}/{item.billingYear}</p>
              <p>{t("userDetails.misc.covers", "Covers")}: {coveredMonth}</p>
              <p>{formatAmount(item.amount, language, item.currency)}</p>
            </div>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] sm:self-start", styles.bg, styles.text)}>
            {t(`paymentsPage.status.${item.status}`, item.status)}
          </span>
        </div>

        <div className="mt-3 grid gap-2 text-[13px] text-slate-600 sm:grid-cols-2 md:text-sm">
          <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.misc.due", "Due")}</p>
            <p className="mt-1 text-slate-900">{formatDateTime(item.dueDate, t, language)}</p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.misc.paid", "Paid")}</p>
            <p className="mt-1 text-slate-900">{formatDateTime(item.paidAt, t, language)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

// ===== MAIN PAGE COMPONENT =====
export default function UserDetailsPage() {
  const params = useParams();
  const { showSuccess, showError, requestPrompt, popupNode } = useActionPopup();
  const [kickOutEnrollment] = useKickOutEnrollmentMutation();
  const [kickingOutEnrollmentId, setKickingOutEnrollmentId] = useState("");
  const userId = typeof params?.userId === "string" ? params.userId : "";

  const {
    user, summary, enrollments, payments,
    isPageLoading, isError, error, refetch,
    canKickOut, canOpenUserList, t, language
  } = useUserDetails(userId);

  const isStudentUser = user?.role === ROLES.STUDENT;

  // Computed values
  const stats = useMemo(() => ({
    approvedEnrollments: enrollments.filter((i) => i.status === "approved").length,
    duePayments: payments.filter((i) => i.status === "due").length,
    pendingEnrollments: summary?.enrollment?.pending || 0,
    rejectedEnrollments: summary?.enrollment?.rejected || 0,
    kickedOutEnrollments: summary?.enrollment?.kickedOut || 0,
    paidPayments: summary?.payments?.paidCount || 0,
    waivedPayments: summary?.payments?.waivedCount || 0,
    totalEnrollments: summary?.enrollment?.total || enrollments.length,
    lastPaidAt: summary?.payments?.lastPaidAt || null,
  }), [enrollments, payments, summary]);

  const relatedCourses = useMemo(() => {
    const courseMap = new Map();

    const addCourse = (batch, tag) => {
      const id = String(batch?._id || "");
      if (!id) return;

      if (!courseMap.has(id)) {
        courseMap.set(id, {
          _id: id,
          name: batch?.name || "Unnamed course",
          slug: batch?.slug || "",
          status: batch?.status || "unknown",
          monthlyFee: batch?.monthlyFee,
          currency: batch?.currency || "BDT",
          facebookGroupUrl: batch?.facebookGroupUrl || "",
          startsAt: batch?.startsAt || null,
          endsAt: batch?.endsAt || null,
          tags: new Set(),
        });
      }
      courseMap.get(id).tags.add(tag);
    };

    (user?.assignedBatches || []).forEach((b) => addCourse(b, t("userDetails.misc.assigned", "Assigned")));
    enrollments.forEach((e) => addCourse(e?.batch, `${t("userDetails.misc.enrollmentPrefix", "Enrollment")}: ${t(`enrollmentsPage.status.${e?.status}`, e?.status || "unknown")}`));
    if (isStudentUser) {
      payments.forEach((p) => addCourse(p?.batch, `${t("userDetails.misc.paymentPrefix", "Payment")}: ${t(`paymentsPage.status.${p?.status}`, p?.status || "unknown")}`));
    }

    return Array.from(courseMap.values()).map((c) => ({ ...c, tags: Array.from(c.tags) }));
  }, [enrollments, isStudentUser, payments, t, user]);

  const totalRelatedCourses = summary?.courses?.totalRelatedCourses || relatedCourses.length;

  // Derived user info
  const profileName = user?.fullName || t("userDetails.messages.unnamedUser", "Unnamed User");
  const profileEmail = user?.email || t("userDetails.messages.noEmail", "No email");
  const facebookHref = resolveFacebookHref(user?.facebookProfileId);
  const userDisplayRole = getUserDisplayRoleLabel(user, t);
  const userAcademicTag = getVisibleAcademicTag(user);

  const errorMessage = normalizeApiError(error, t("userDetails.messages.loadError", "Failed to load user details."));

  // Handlers
  const handleKickOut = async (enrollment) => {
    const courseName = enrollment?.batch?.name || t("userDetails.misc.thisCourse", "this course");
    const reason = await requestPrompt({
      title: t("userDetails.messages.kickoutTitle", "Kick Out Student"),
      text: t("userDetails.messages.removeConfirm", `Remove this student from ${courseName}?`, { course: courseName }),
      input: "textarea",
      placeholder: t("userDetails.messages.kickoutReasonPrompt", "Kick-out reason"),
      inputValue: t("userDetails.messages.defaultKickoutReason", "Removed from course by staff"),
      confirmText: t("userDetails.actions.kickOut", "Kick Out"),
    });
    if (reason === undefined) return;

    const finalReason = String(reason || "").trim() || t("userDetails.messages.defaultKickoutReason", "Removed from course by staff");

    try {
      setKickingOutEnrollmentId(enrollment._id);
      await kickOutEnrollment({ enrollmentId: enrollment._id, reason: finalReason }).unwrap();
      showSuccess(t("userDetails.messages.kickoutSuccess", "Student removed from the selected course."));
      refetch();
    } catch (err) {
      showError(normalizeApiError(err, t("userDetails.messages.kickoutFailed", "Failed to remove student from course.")));
    } finally {
      setKickingOutEnrollmentId("");
    }
  };

  // ===== RENDER =====
  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR]}>
      <main className="site-shell min-h-screen pb-8 md:pb-10">
        <section className="container-page py-3 md:py-5">
          <RevealSection className="space-y-3.5 md:space-y-4.5" noStagger>
            {/* Header Card */}
            <RevealItem className="site-panel overflow-hidden rounded-[22px] md:rounded-[24px]">
              <div className="grid gap-3 p-3 sm:p-3.5 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-3.5 lg:p-4">
                {/* Main Content */}
                <div className="min-w-0">
                  <p className="site-kicker">{t("userDetails.layout.kicker", "User Details")}</p>
                  <h1 className="mt-2 text-[18px] font-black tracking-tight text-slate-950 md:text-[24px]">
                    {t("userDetails.layout.title", "Directory Profile")}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-600 md:text-[13px] md:leading-[22px]">
                    {t("userDetails.messages.pageIntro", "Structured profile, course links, and operational history in one place.")}
                  </p>

                  {/* Loading/Error/Content States */}
                  {isPageLoading ? (
                    <div className="mt-3.5 rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
                      <ListSkeleton rows={4} />
                    </div>
                  ) : isError ? (
                    <div className="mt-3.5 rounded-[16px] border border-rose-200 bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 md:text-[13px]">
                      {errorMessage}
                    </div>
                  ) : !user ? (
                    <div className="mt-3.5 rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600 md:text-[13px]">
                      {t("userDetails.messages.userNotFound", "User not found.")}
                    </div>
                  ) : (
                    <>
                      {/* Profile Header */}
                      <div className="mt-3.5 rounded-[18px] border border-slate-200 bg-slate-50/80 p-3 shadow-sm sm:p-3.5">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
                          <Avatar
                            src={user.profilePhoto?.url}
                            name={profileName}
                            className="h-14 w-14 rounded-[16px] border-4 border-white shadow-lg md:h-16 md:w-16"
                            fallbackClassName="rounded-[16px] bg-slate-900 text-sm font-black text-white"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h2 className="min-w-0 text-[15px] font-black tracking-tight text-slate-950 md:text-[17px]">
                                {profileName}
                              </h2>
                              {user?.role && <RoleBadge role={user.role} />}
                              <AcademicStatusTag status={userAcademicTag} />
                            </div>
                            <p className="mt-1 break-words text-[12px] text-slate-600 md:text-[13px]">{profileEmail}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {userDisplayRole}{user?.academicBatchLabel ? ` • ${user.academicBatchLabel}` : ""}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-700 shadow-sm">
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                                {t("userDetails.layout.role", "Role")}: {user.role || t("userDetails.misc.na", "N/A")}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-700 shadow-sm">
                                <Users className="h-3.5 w-3.5" strokeWidth={2.2} />
                                {isStudentUser ? t("userDetails.misc.student", "Student") : t("userDetails.misc.staff", "Staff")}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-700 shadow-sm">
                                <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
                                {totalRelatedCourses} {t("userDetails.layout.relatedCourses", "Related Courses")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className={cn("mt-3.5 grid gap-2 sm:grid-cols-2", isStudentUser ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-2")}>
                        <MetricCard icon={BookOpen} label={t("userDetails.layout.relatedCourses", "Related Courses")} value={totalRelatedCourses} helper={t("userDetails.layout.courseLinks", "Course Links")} tone="slate" />
                        <MetricCard icon={Users} label={t("userDetails.layout.enrollmentSummary", "Enrollment Summary")} value={stats.totalEnrollments} helper={`${t("userDetails.layout.approved", "Approved")}: ${stats.approvedEnrollments} · ${t("userDetails.layout.pending", "Pending")}: ${stats.pendingEnrollments} · ${t("userDetails.layout.rejected", "Rejected")}: ${stats.rejectedEnrollments} · ${t("userDetails.layout.kickedOut", "Removed")}: ${stats.kickedOutEnrollments}`} tone="emerald" />
                        {isStudentUser && (
                          <>
                            <MetricCard icon={CreditCard} label={t("userDetails.layout.openDues", "Open Dues")} value={stats.duePayments} helper={`${formatAmount(summary?.payments?.totalDue || 0, language)} · ${t("userDetails.layout.waived", "Waived")}: ${stats.waivedPayments}`} tone="amber" />
                            <MetricCard icon={CreditCard} label={t("userDetails.layout.paymentSummary", "Payment Summary")} value={stats.paidPayments} helper={`${formatAmount(summary?.payments?.totalPaid || 0, language)} · ${t("userDetails.layout.lastPaid", "Last Paid")}: ${formatDate(stats.lastPaidAt, t, language)}`} tone="cyan" />
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Sidebar */}
                <aside className="site-panel rounded-[18px] p-2.5 md:rounded-[20px] md:p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.layout.actions", "Actions")}</p>
                  <div className="mt-2.5 grid gap-1.5">
                    <button type="button" onClick={() => refetch()} className="inline-flex items-center justify-between rounded-[14px] border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2.5 py-2 text-left text-[11px] font-semibold text-[var(--action-soft-text)] transition hover:border-transparent hover:bg-[var(--page-teal)] hover:text-white">
                      <span>{t("userDetails.actions.refresh", "Refresh")}</span>
                      <RefreshCcw className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                    <Link href={`/users/${userId}`} className="inline-flex items-center justify-between rounded-[14px] border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2.5 py-2 text-[11px] font-semibold text-[var(--action-soft-text)] transition hover:border-transparent hover:bg-[var(--page-teal)] hover:text-white">
                      <span>{t("userDetails.actions.publicProfile", "Public Profile")}</span>
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                    </Link>
                    <Link href={canOpenUserList ? "/users" : "/dashboard"} className="site-button-primary !w-full !justify-between !rounded-[14px] !px-2.5 !py-2 !text-[11px] !tracking-[0.08em]">
                      <span>{canOpenUserList ? t("userDetails.actions.backToUsers", "Back to Users") : t("userDetails.actions.backToDashboard", "Back to Dashboard")}</span>
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                    </Link>
                  </div>

                  {!isPageLoading && !isError && user && (
                    <div className="mt-2.5 rounded-[16px] border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.layout.currentStanding", "Current Standing")}</p>
                      <div className="mt-2 space-y-1.5">
                        {[
                          { label: t("userDetails.layout.currentStanding", "Current Standing"), value: userDisplayRole },
                          { label: t("userDetails.layout.batch", "Academic Batch"), value: user?.academicBatchLabel },
                          { label: t("userDetails.layout.lastLogin", "Last Login"), value: formatDate(user.lastLoginAt, t, language) },
                          { label: isStudentUser ? t("userDetails.layout.lastPaid", "Last Paid") : t("userDetails.layout.enrollments", "Enrollments"), value: isStudentUser ? formatDate(stats.lastPaidAt, t, language) : stats.totalEnrollments },
                        ].map((item, i) => (
                          <div key={i} className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                            <p className="mt-1 text-[12px] font-semibold text-slate-900 md:text-[13px]">{item.value || t("userDetails.misc.na", "N/A")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </RevealItem>

            {/* Detail Sections */}
            {!isPageLoading && !isError && user && (
              <RevealItem className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] xl:gap-4">
                {/* Left Column */}
                <div className="min-w-0 space-y-3 md:space-y-4">
                  <SectionCard kicker={t("userDetails.layout.personalDetails", "Personal Details")} title={t("userDetails.layout.personalSnapshot", "Personal Snapshot")} description={t("userDetails.messages.personalSnapshot", "Core identity, contact, and academic information for this account.")}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <InfoField icon={Users} label={t("userDetails.layout.name", "Name")} value={profileName} />
                      <InfoField icon={Mail} label={t("userDetails.layout.email", "Email")} value={profileEmail} href={user.email ? `mailto:${user.email}` : ""} breakAll />
                      <InfoField icon={Phone} label={t("userDetails.layout.phone", "Phone")} value={user.phone || t("userDetails.misc.na", "N/A")} href={user.phone ? `tel:${user.phone}` : ""} />
                      <InfoField icon={School} label={t("userDetails.layout.school", "School")} value={user.school || t("userDetails.misc.na", "N/A")} />
                      <InfoField icon={GraduationCap} label={t("userDetails.layout.varsity", "Varsity")} value={user.varsity || t("userDetails.misc.na", "N/A")} />
                      <InfoField icon={GraduationCap} label={t("userDetails.layout.college", "College")} value={user.college || t("userDetails.misc.na", "N/A")} />
                      <InfoField icon={BriefcaseBusiness} label={t("userDetails.layout.experience", "Experience")} value={user.experience || t("userDetails.misc.na", "N/A")} />
                      <InfoField icon={Facebook} label={t("userDetails.layout.facebook", "Facebook")} value={user.facebookProfileId || t("userDetails.misc.na", "N/A")} href={facebookHref} breakAll />
                      <InfoField icon={CalendarDays} label={t("userDetails.layout.created", "Created")} value={formatDateTime(user.createdAt, t, language)} />
                      <InfoField icon={CalendarDays} label={t("userDetails.layout.lastLogin", "Last Login")} value={formatDateTime(user.lastLoginAt, t, language)} />
                    </div>
                  </SectionCard>

                  <SectionCard kicker={t("userDetails.layout.relatedCourses", "Related Courses")} title={t("userDetails.layout.courseLinks", "Course Links")} description={t("userDetails.messages.courseSignals", "Direct course relationships from assignments, enrollments, and payment activity.")} count={relatedCourses.length}>
                    {relatedCourses.length === 0 ? (
                      <EmptyState message={t("userDetails.misc.noRelatedCourses", "No related courses for this user.")} />
                    ) : (
                      <div className="space-y-3">
                        {relatedCourses.map((course) => (
                          <article key={course._id} className="rounded-[16px] border border-slate-200 bg-slate-50/75 p-2.5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3 className="text-[13px] font-black tracking-tight text-slate-950 md:text-[14px]">{course.name}</h3>
                                <p className="mt-1 break-words text-[12px] text-slate-600 md:text-[13px]">{course.slug || t("userDetails.misc.noSlug", "no-slug")} · {formatAmount(course.monthlyFee || 0, language, course.currency)}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-700 shadow-sm">{t(`courseCard.status.${course.status}`, course.status)}</span>
                                <Link href={`/courses/${course._id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--action-soft-text)] transition hover:border-transparent hover:bg-[var(--page-teal)] hover:text-white">
                                  {t("userDetails.actions.openCourse", "Open Course")}
                                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                                </Link>
                                {course.facebookGroupUrl && (
                                  <a {...getLinkProps(course.facebookGroupUrl)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--action-soft-text)] transition hover:border-transparent hover:bg-[var(--page-teal)] hover:text-white">
                                    {t("userDetails.actions.facebookGroup", "Group")}
                                    <Link2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 grid gap-1.5 text-[10px] text-slate-600 sm:grid-cols-2">
                              <div className="rounded-[14px] border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.layout.startsAt", "Starts")}</p>
                                <p className="mt-1 text-[10px] text-slate-900">{formatDate(course.startsAt, t, language)}</p>
                              </div>
                              <div className="rounded-[14px] border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{t("userDetails.layout.endsAt", "Ends")}</p>
                                <p className="mt-1 text-[10px] text-slate-900">{formatDate(course.endsAt, t, language)}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {course.tags.map((tag, i) => (
                                <span key={i} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">{tag}</span>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* Right Column */}
                <div className="min-w-0 space-y-3 md:space-y-4">
                  <SectionCard kicker={t("userDetails.layout.enrollments", "Enrollments")} title={t("userDetails.layout.enrollmentHistory", "Enrollment History")} description={t("userDetails.messages.enrollmentLedger", "Review application state changes and approved course access from one stream.")} count={enrollments.length}>
                    {enrollments.length === 0 ? (
                      <EmptyState message={t("userDetails.misc.noEnrollments", "No enrollment history.")} />
                    ) : (
                      <div className="space-y-3">
                        {enrollments.map((item) => (
                          <EnrollmentRecord
                            key={item._id}
                            item={item}
                            canKickOut={isStudentUser && canKickOut}
                            kickingOutEnrollmentId={kickingOutEnrollmentId}
                            onKickOut={handleKickOut}
                            t={t}
                            language={language}
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {isStudentUser && (
                    <SectionCard kicker={t("userDetails.layout.totalPaid", "Total Paid")} title={t("userDetails.layout.paymentHistory", "Payment History")} description={t("userDetails.messages.paymentLedger", "Track billing cycles, due dates, payment completion, and waived records.")} count={payments.length}>
                      {payments.length === 0 ? (
                        <EmptyState message={t("userDetails.misc.noPayments", "No payment records.")} />
                      ) : (
                        <div className="space-y-3">
                          {payments.map((item) => (
                            <PaymentRecord key={item._id} item={item} t={t} language={language} />
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  )}
                </div>
              </RevealItem>
            )}
          </RevealSection>
        </section>
        {popupNode}
      </main>
    </RequireAuth>
  );
}
