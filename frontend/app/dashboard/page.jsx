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
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

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
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
      color: "emerald"
    },
    {
      id: "admin-slider-control",
      titleKey: "dashboard.actions.admin.slider.title",
      descriptionKey: "dashboard.actions.admin.slider.description",
      href: "/dashboard/slider-control",
      badge: "SLIDER",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l1.29 1.29m-4.733 3.523L15.75 17.25l-2.646 2.646a2.25 2.25 0 01-3.181 0l-1.29-1.29m1.408-1.408L7.5 18H3.75c-.621 0-1.125-.504-1.125-1.125V13.5m1.5-1.5H6.75a1.125 1.125 0 011.125 1.125v2.25M6.75 12H3.75a1.125 1.125 0 00-1.125 1.125V18M18 18h3.75c.621 0 1.125-.504 1.125-1.125V13.5m-1.5-1.5H17.25a1.125 1.125 0 00-1.125 1.125v2.25M17.25 12h3" />,
      color: "amber"
    },
    {
      id: "admin-site-settings",
      titleKey: "dashboard.actions.admin.settings.title",
      descriptionKey: "dashboard.actions.admin.settings.description",
      href: "/dashboard/site-settings",
      badge: "SETTINGS",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />,
      color: "slate"
    },
    {
      id: "admin-enrollments",
      titleKey: "dashboard.actions.admin.enrollments.title",
      descriptionKey: "dashboard.actions.admin.enrollments.description",
      href: "/enrollments",
      badge: "REVIEWS",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: "sky"
    },
    {
      id: "admin-users",
      titleKey: "dashboard.actions.admin.users.title",
      descriptionKey: "dashboard.actions.admin.users.description",
      href: "/users",
      badge: "USERS",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
      color: "indigo"
    },
    {
      id: "admin-payments",
      titleKey: "dashboard.actions.admin.payments.title",
      descriptionKey: "dashboard.actions.admin.payments.description",
      href: "/payments",
      badge: "FINANCE",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V14.128a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25v2.622z" />,
      color: "rose"
    },
  ],
  teacher: [
    {
      id: "teacher-courses",
      titleKey: "dashboard.actions.teacher.courses.title",
      descriptionKey: "dashboard.actions.teacher.courses.description",
      href: "/courses",
      badge: "CONTENT",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
      color: "emerald"
    },
  ],
  moderator: [
    {
      id: "moderator-courses",
      titleKey: "dashboard.actions.moderator.courses.title",
      descriptionKey: "dashboard.actions.moderator.courses.description",
      href: "/courses",
      badge: "COURSES",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
      color: "emerald"
    },
    {
      id: "moderator-enrollments",
      titleKey: "dashboard.actions.moderator.enrollments.title",
      descriptionKey: "dashboard.actions.moderator.enrollments.description",
      href: "/enrollments",
      badge: "QUEUE",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: "sky"
    },
    {
      id: "moderator-payments",
      titleKey: "dashboard.actions.moderator.payments.title",
      descriptionKey: "dashboard.actions.moderator.payments.description",
      href: "/payments",
      badge: "FINANCE",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V14.128a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25v2.622z" />,
      color: "rose"
    },
  ],
  student: [
    {
      id: "student-courses",
      titleKey: "dashboard.actions.student.courses.title",
      descriptionKey: "dashboard.actions.student.courses.description",
      href: "/courses",
      badge: "COURSES",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
      color: "emerald"
    },
    {
      id: "student-enrollments",
      titleKey: "dashboard.actions.student.enrollments.title",
      descriptionKey: "dashboard.actions.student.enrollments.description",
      href: "/enrollments",
      badge: "ENROLL",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: "sky"
    },
    {
      id: "student-payments",
      titleKey: "dashboard.actions.student.payments.title",
      descriptionKey: "dashboard.actions.student.payments.description",
      href: "/payments",
      badge: "PAY",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V14.128a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25v2.622z" />,
      color: "rose"
    },
  ],
};

function StatBox({ label, value, accent = "slate", loading = false, loadingLabel = "" }) {
  const accents = {
    amber: "border-amber-100/50 bg-amber-50/30 text-amber-700 ring-1 ring-amber-100/30",
    emerald: "border-emerald-100/50 bg-emerald-50/30 text-emerald-700 ring-1 ring-emerald-100/30",
    sky: "border-sky-100/50 bg-sky-50/30 text-sky-700 ring-1 ring-sky-100/30",
    indigo: "border-indigo-100/50 bg-indigo-50/30 text-indigo-700 ring-1 ring-indigo-100/30",
    rose: "border-rose-100/50 bg-rose-50/30 text-rose-700 ring-1 ring-rose-100/30",
    slate: "border-slate-100/50 bg-slate-50/30 text-slate-600 ring-1 ring-slate-100/30",
  };

  return (
    <div className={`group relative overflow-hidden rounded-lg border p-2.5 md:p-3 ${accents[accent] || accents.slate} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
      <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">{label}</p>
      <div className="mt-1 md:mt-1.5 flex items-center">
        {loading ? (
          <InlineLoader label={loadingLabel} />
        ) : (
          <p className="text-xl md:text-2xl font-extrabold tabular-nums tracking-tighter transition-transform duration-300 group-hover:scale-[1.02] origin-left">{value}</p>
        )}
      </div>
    </div>
  );
}

function OperationsCard({ item, t }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    sky: "bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-100 group-hover:border-sky-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200",
    rose: "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    slate: "bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-100 group-hover:border-slate-200",
  };

  return (
    <Link
      href={item.href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-transparent hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${colors[item.color] || colors.slate}`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {item.icon}
        </svg>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 transition-colors duration-300 group-hover:text-indigo-600">
            {t(item.titleKey)}
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
            {item.badge}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
          {t(item.descriptionKey)}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-500 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        <span>{t("dashboard.open")}</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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
          <RevealSection noStagger>
          <header className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-6">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.03),transparent_40%)]" />
            
            <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/40 px-2 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  </span>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600">{t("dashboard.kicker")}</p>
                </div>
                
                <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
                  {t(`${roleCopy.titleKey.replace(".title", ".accent")}`) && (
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      {t(`${roleCopy.titleKey.replace(".title", ".accent")}`)}{" "}
                    </span>
                  )}
                  {t(roleCopy.titleKey)}
                </h1>
                
                <p className="mt-2 max-w-lg text-[11px] font-medium leading-relaxed text-slate-500 md:text-sm">
                  {t(roleCopy.subtitleKey)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {currentUser?.fullName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50/50 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{currentUser.fullName}</span>
                      {role ? <RoleBadge role={role} /> : null}
                    </span>
                  )}
                </div>
              </div>

              {/* Integrated Primary Stats (Right Side) */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:w-auto xl:grid-cols-2 2xl:grid-cols-4">
                {stats.map((item) => (
                  <RevealItem key={item.id}>
                    <StatBox
                      label={item.label}
                      value={item.value}
                      accent={item.accent}
                      loading={item.loading}
                      loadingLabel="..."
                    />
                  </RevealItem>
                ))}
              </div>
            </div>
          </header>
        </RevealSection>

          <RevealSection className="mt-6 md:mt-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">{t("dashboard.operations")}</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900 md:text-2xl">
                  {t("dashboard.roleSpecificTools")}
                </h2>
              </div>
              <div className="h-px flex-1 bg-slate-100 hidden sm:block" />
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-500 shadow-sm">
                {actions.length} {t("dashboard.items")}
              </span>
            </div>

            {actions.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 text-center">
                <p className="text-sm font-medium text-slate-500">{t("dashboard.noRoleActions")}</p>
              </div>
            ) : (
              <RevealSection className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {actions.map((item) => (
                  <RevealItem key={item.id}>
                    <OperationsCard item={item} t={t} />
                  </RevealItem>
                ))}
              </RevealSection>
            )}
          </RevealSection>
        </div>
      </section>
    </RequireAuth>
  );
}
