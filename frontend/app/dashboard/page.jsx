"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { InlineLoader } from "@/components/loaders/AppLoader";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import {
  useGetEnrollmentRequestsForReviewQuery,
  useGetMyEnrollmentRequestsQuery,
} from "@/lib/features/enrollment/enrollmentApi";
import { useGetGlobalPaymentsQuery, useGetMyPaymentsQuery } from "@/lib/features/payment/paymentApi";
import { useListUsersQuery } from "@/lib/features/user/userApi";
import { selectCurrentUser, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const ROLE_COPY = {
  admin: {
    titleKey: "dashboard.roleCopy.admin.title",
    subtitleKey: "dashboard.roleCopy.admin.subtitle",
    noteKey: "dashboard.roleCopy.admin.note",
  },
  teacher: {
    titleKey: "dashboard.roleCopy.teacher.title",
    subtitleKey: "dashboard.roleCopy.teacher.subtitle",
    noteKey: "dashboard.roleCopy.teacher.note",
  },
  moderator: {
    titleKey: "dashboard.roleCopy.moderator.title",
    subtitleKey: "dashboard.roleCopy.moderator.subtitle",
    noteKey: "dashboard.roleCopy.moderator.note",
  },
  student: {
    titleKey: "dashboard.roleCopy.student.title",
    subtitleKey: "dashboard.roleCopy.student.subtitle",
    noteKey: "dashboard.roleCopy.student.note",
  },
};

const ROLE_ACTIONS = {
  admin: [
    {
      id: "admin-courses",
      titleKey: "dashboard.actions.admin.courses.title",
      descriptionKey: "dashboard.actions.admin.courses.description",
      href: "/courses",
      badge: "COURSES",
    },
    {
      id: "admin-slider-control",
      titleKey: "dashboard.actions.admin.slider.title",
      descriptionKey: "dashboard.actions.admin.slider.description",
      href: "/dashboard/slider-control",
      badge: "SLIDER",
    },
    {
      id: "admin-site-settings",
      titleKey: "dashboard.actions.admin.settings.title",
      descriptionKey: "dashboard.actions.admin.settings.description",
      href: "/dashboard/site-settings",
      badge: "SETTINGS",
    },
    {
      id: "admin-enrollments",
      titleKey: "dashboard.actions.admin.enrollments.title",
      descriptionKey: "dashboard.actions.admin.enrollments.description",
      href: "/enrollments",
      badge: "REVIEWS",
    },
    {
      id: "admin-users",
      titleKey: "dashboard.actions.admin.users.title",
      descriptionKey: "dashboard.actions.admin.users.description",
      href: "/users",
      badge: "USERS",
    },
    {
      id: "admin-payments",
      titleKey: "dashboard.actions.admin.payments.title",
      descriptionKey: "dashboard.actions.admin.payments.description",
      href: "/payments",
      badge: "FINANCE",
    },
  ],
  teacher: [
    {
      id: "teacher-courses",
      titleKey: "dashboard.actions.teacher.courses.title",
      descriptionKey: "dashboard.actions.teacher.courses.description",
      href: "/courses",
      badge: "CONTENT",
    },
  ],
  moderator: [
    {
      id: "moderator-courses",
      titleKey: "dashboard.actions.moderator.courses.title",
      descriptionKey: "dashboard.actions.moderator.courses.description",
      href: "/courses",
      badge: "COURSES",
    },
    {
      id: "moderator-enrollments",
      titleKey: "dashboard.actions.moderator.enrollments.title",
      descriptionKey: "dashboard.actions.moderator.enrollments.description",
      href: "/enrollments",
      badge: "QUEUE",
    },
    {
      id: "moderator-payments",
      titleKey: "dashboard.actions.moderator.payments.title",
      descriptionKey: "dashboard.actions.moderator.payments.description",
      href: "/payments",
      badge: "FINANCE",
    },
  ],
  student: [
    {
      id: "student-courses",
      titleKey: "dashboard.actions.student.courses.title",
      descriptionKey: "dashboard.actions.student.courses.description",
      href: "/courses",
      badge: "COURSES",
    },
    {
      id: "student-enrollments",
      titleKey: "dashboard.actions.student.enrollments.title",
      descriptionKey: "dashboard.actions.student.enrollments.description",
      href: "/enrollments",
      badge: "ENROLL",
    },
    {
      id: "student-payments",
      titleKey: "dashboard.actions.student.payments.title",
      descriptionKey: "dashboard.actions.student.payments.description",
      href: "/payments",
      badge: "PAY",
    },
  ],
};

function StatBox({ label, value, accent = "slate", loading = false, loadingLabel = "" }) {
  const accents = {
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    sky: "border-sky-200 bg-sky-50/60 text-sky-700",
    indigo: "border-indigo-200 bg-indigo-50/60 text-indigo-700",
    rose: "border-rose-200 bg-rose-50/60 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`rounded-xl border p-3 md:p-4 ${accents[accent] || accents.slate} shadow-sm transition-all hover:shadow hover:-translate-y-0.5`}>
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{label}</p>
      <div className="mt-1 min-h-[24px] md:min-h-[28px] flex items-center">
        {loading ? (
          <InlineLoader label={loadingLabel} />
        ) : (
          <p className="text-xl md:text-2xl font-extrabold tracking-tight drop-shadow-sm">{value}</p>
        )}
      </div>
    </div>
  );
}

function OperationsCard({ item, t }) {
  return (
    <Link
      href={item.href}
      className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-3 md:p-5 shadow-[0_4px_10px_rgba(15,23,42,0.03)] transition-all duration-300 hover:border-indigo-100 hover:shadow-[0_12px_24px_rgba(79,70,229,0.12)] sm:flex-col sm:items-start"
    >
      <div className="absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-slate-50 opacity-50 transition-colors duration-300 group-hover:bg-indigo-50 sm:block" />
      
      <div className="relative flex min-w-0 flex-1 items-center gap-3 sm:block">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-indigo-600 transition-colors group-hover:bg-indigo-50 sm:hidden">
           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
           </svg>
        </div>
        
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2 py-0.5 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--action-soft-text)] transition-colors duration-300 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
            {item.badge}
          </span>
          <h3 className="mt-0.5 text-sm font-extrabold text-slate-900 truncate transition-colors duration-300 group-hover:text-indigo-900 sm:mt-3 sm:text-base sm:whitespace-normal">
            {t(item.titleKey)}
          </h3>
          <p className="hidden mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-600 sm:block">
            {t(item.descriptionKey)}
          </p>
        </div>
      </div>
      
      <div className="relative ml-3 flex shrink-0 items-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 transition-colors duration-300 group-hover:text-indigo-600 sm:mt-5 sm:ml-0">
        <span className="hidden sm:inline">{t("dashboard.open")}</span>
        <svg className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1 sm:ml-1.5 sm:h-3.5 sm:w-3.5 sm:group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" className="sm:hidden" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" className="hidden sm:block" />
        </svg>
      </div>
    </Link>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 md:py-2.5">
      <dt className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="max-w-[65%] break-all text-right text-xs md:text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentUserRole);
  const { t } = useSiteLanguage();

  const studentRole = isStudent(role);
  const adminRole = isAdmin(role);
  const staffReviewRole = role === "moderator" || role === "admin";

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dashboardSkip = !isInitialized || !isAuthenticated;

  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery(undefined, {
    skip: dashboardSkip,
  });
  const { data: myEnrollmentsData, isLoading: myEnrollmentsLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: dashboardSkip || !studentRole,
  });
  const { data: myPaymentsData, isLoading: myPaymentsLoading } = useGetMyPaymentsQuery(undefined, {
    skip: dashboardSkip || !studentRole,
  });
  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: "pending" },
    { skip: dashboardSkip || !staffReviewRole }
  );
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery(undefined, {
    skip: dashboardSkip || !adminRole,
  });
  const { data: globalPaymentsData, isLoading: globalPaymentsLoading } = useGetGlobalPaymentsQuery(undefined, {
    skip: dashboardSkip || !adminRole,
  });

  const roleCopy = ROLE_COPY[role] || {
    titleKey: "dashboard.roleCopy.default.title",
    subtitleKey: "dashboard.roleCopy.default.subtitle",
    noteKey: "dashboard.roleCopy.default.note",
  };

  const actions = ROLE_ACTIONS[role] || [];
  const courses = coursesData?.data || [];
  const activeOrUpcomingCourses = courses.filter(
    (course) => course.status === "active" || course.status === "upcoming"
  );

  const myEnrollments = myEnrollmentsData?.data || [];
  const approvedCount = myEnrollments.filter((item) => item.status === "approved").length;
  const pendingCount = myEnrollments.filter((item) => item.status === "pending").length;
  const paymentSummary = myPaymentsData?.summary || { dueCount: 0, totalDue: 0 };

  const pendingReviews = reviewData?.data?.length || 0;
  const totalUsers = usersData?.data?.length || 0;
  const totalGlobalPayments = globalPaymentsData?.data?.length || 0;

  const stats = useMemo(() => {
    if (studentRole) {
      return [
        { id: "student-approved", label: t("dashboard.stats.student.approvedCourses"), value: approvedCount, loading: myEnrollmentsLoading },
        { id: "student-pending", label: t("dashboard.stats.student.pendingRequests"), value: pendingCount, loading: myEnrollmentsLoading },
        {
          id: "student-due-amount",
          label: t("dashboard.stats.student.dueAmount"),
          value: paymentSummary.dueCount > 0 ? `${paymentSummary.dueCount} ${t("dashboard.stats.student.dueMonthsHint")}` : 0,
          loading: myPaymentsLoading,
          accent: paymentSummary.totalDue > 0 ? "amber" : "emerald",
        },
      ];
    }

    if (adminRole) {
      return [
        { id: "admin-users", label: t("dashboard.stats.admin.totalUsers"), value: totalUsers, loading: usersLoading, accent: "indigo" },
        {
          id: "admin-courses",
          label: t("dashboard.stats.admin.totalCourses"),
          value: courses.length,
          loading: coursesLoading,
          accent: "sky",
        },
        { id: "admin-reviews", label: t("dashboard.stats.shared.pendingReviews"), value: pendingReviews, loading: reviewLoading, accent: pendingReviews > 0 ? "amber" : "slate" },
        {
          id: "admin-payments",
          label: t("dashboard.stats.admin.globalPayments"),
          value: totalGlobalPayments,
          loading: globalPaymentsLoading,
          accent: "emerald",
        },
      ];
    }

      return [
        {
          id: "staff-courses",
          label: t("dashboard.stats.shared.activeUpcomingCourses"),
          value: activeOrUpcomingCourses.length,
          loading: coursesLoading,
          accent: "indigo",
        },
      { id: "staff-reviews", label: t("dashboard.stats.shared.pendingReviews"), value: pendingReviews, loading: reviewLoading, accent: pendingReviews > 0 ? "amber" : "slate" },
      { id: "staff-total-courses", label: t("dashboard.stats.admin.totalCourses"), value: courses.length, loading: coursesLoading, accent: "sky" },
    ];
  }, [
    activeOrUpcomingCourses.length,
    adminRole,
    approvedCount,
    courses.length,
    coursesLoading,
    globalPaymentsLoading,
    myEnrollmentsLoading,
    myPaymentsLoading,
    paymentSummary.dueCount,
    paymentSummary.totalDue,
    pendingCount,
    pendingReviews,
    reviewLoading,
    studentRole,
    totalGlobalPayments,
    totalUsers,
    t,
    usersLoading,
  ]);

  return (
    <RequireAuth>
      <section className="site-shell min-h-screen pb-14">
        <div className="container-page py-8 md:py-10">
          <header className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-gradient-to-br from-white via-white to-[var(--action-soft-bg)] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)] md:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <div>
                <p className="site-kicker text-indigo-600 drop-shadow-sm">{t("dashboard.kicker")}</p>
                <h1 className="mt-2 md:mt-3 text-2xl font-black text-slate-900 drop-shadow-sm [font-family:'Trebuchet_MS','Avenir_Next','Segoe_UI',sans-serif] md:text-4xl">
                  {t(`${roleCopy.titleKey.replace(".title", ".accent")}`) && (
                    <span className="text-emerald-600">
                      {t(`${roleCopy.titleKey.replace(".title", ".accent")}`)}{" "}
                    </span>
                  )}
                  {t(roleCopy.titleKey)}
                </h1>
                <p className="mt-1.5 md:mt-2.5 max-w-2xl text-[13px] md:text-sm font-medium leading-relaxed text-slate-600">{t(roleCopy.subtitleKey)}</p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {role ? <RoleBadge role={role} /> : null}
                  {currentUser?.fullName ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-[11px] font-bold text-indigo-700">
                      <svg className="h-3 w-3 md:h-3.5 md:w-3.5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {currentUser.fullName}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-500">
                      {t("dashboard.profileLoading")}
                    </span>
                  )}
                </div>
              </div>

              <aside className="rounded-[clamp(8px,5%,10px)] border border-slate-200 bg-white p-3 md:p-4 shadow-[0_6px_14px_rgba(15,23,42,0.07)]">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("dashboard.liveSnapshot")}</p>
                <dl className="mt-1 md:mt-2 divide-y divide-slate-100">
                  <DetailRow label={t("dashboard.stats.shared.activeUpcoming")} value={coursesLoading ? "..." : activeOrUpcomingCourses.length} />
                  <DetailRow label={t("dashboard.stats.shared.pendingReviews")} value={reviewLoading ? "..." : pendingReviews} />
                  <DetailRow label={t("dashboard.stats.admin.totalCourses")} value={coursesLoading ? "..." : courses.length} />
                </dl>
              </aside>
            </div>
          </header>

          <section className="mt-4 md:mt-6">
            <div className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 ${adminRole ? "xl:grid-cols-4" : ""}`}>
              {stats.map((item) => (
                <StatBox
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  accent={item.accent}
                  loading={item.loading}
                  loadingLabel={t("dashboard.loading")}
                />
              ))}
            </div>
          </section>

          <section className="mt-5 md:mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,360px)]">
            <div className="site-panel rounded-[clamp(8px,5%,12px)] p-4 md:p-6 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t("dashboard.operations")}</p>
                  <h2 className="mt-1 text-lg md:text-2xl font-black text-slate-900">
                    {t("dashboard.roleSpecificTools")}
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {actions.length} {t("dashboard.items")}
                </span>
              </div>

              {actions.length === 0 ? (
                <div className="rounded-[clamp(8px,5%,10px)] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {t("dashboard.noRoleActions")}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {actions.map((item) => (
                    <OperationsCard key={item.id} item={item} t={t} />
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <section className="site-panel rounded-[clamp(8px,5%,10px)] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.07)]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("dashboard.account")}</p>
                <dl className="mt-2 divide-y divide-slate-100">
                  <DetailRow label={t("dashboard.name")} value={currentUser?.fullName || t("dashboard.notSet")} />
                  <DetailRow label={t("dashboard.email")} value={currentUser?.email || t("dashboard.notSet")} />
                  <DetailRow label={t("dashboard.role")} value={role || t("navbar.student")} />
                  <DetailRow label={t("dashboard.phone")} value={currentUser?.phone || t("dashboard.notSet")} />
                </dl>
              </section>

              <section className="rounded-[clamp(8px,5%,10px)] border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--action-soft-text)]">{t("dashboard.focus")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{t(roleCopy.noteKey)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/courses" className="site-button-primary h-9 rounded-full px-4 text-[10px]">
                    {t("dashboard.openCourses")}
                  </Link>
                  <Link href="/profile" className="site-button-secondary h-9 rounded-full px-4 text-[10px]">
                    {t("navbar.profile")}
                  </Link>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </section>
    </RequireAuth>
  );
}
