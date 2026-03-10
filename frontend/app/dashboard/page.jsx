"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSelector } from "react-redux";
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
    {
      id: "teacher-enrollments",
      titleKey: "dashboard.actions.teacher.enrollments.title",
      descriptionKey: "dashboard.actions.teacher.enrollments.description",
      href: "/enrollments",
      badge: "REVIEW",
    },
    {
      id: "teacher-payments",
      titleKey: "dashboard.actions.teacher.payments.title",
      descriptionKey: "dashboard.actions.teacher.payments.description",
      href: "/payments",
      badge: "PAYMENTS",
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

function StatTile({ label, value, hint = "", loading = false, loadingLabel }) {
  return (
    <article className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 min-h-[36px]">
        {loading ? <InlineLoader label={loadingLabel} /> : <p className="text-2xl font-black text-slate-950">{value}</p>}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function OperationsRow({ item, t }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--action-soft-text)]">
            {item.badge}
          </span>
          <h3 className="text-sm font-black text-slate-950 md:text-base">{t(item.titleKey)}</h3>
        </div>
        <p className="mt-1 text-sm text-slate-600">{t(item.descriptionKey)}</p>
      </div>
      <Link href={item.href} className="site-button-primary h-9 rounded-full px-4 text-[10px]">
        {t("dashboard.open")}
      </Link>
    </li>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="max-w-[65%] break-all text-right text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentUserRole);
  const { t } = useSiteLanguage();

  const studentRole = isStudent(role);
  const adminRole = isAdmin(role);
  const staffReviewRole = role === "teacher" || role === "moderator" || role === "admin";

  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery();
  const { data: myEnrollmentsData, isLoading: myEnrollmentsLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !studentRole,
  });
  const { data: myPaymentsData, isLoading: myPaymentsLoading } = useGetMyPaymentsQuery(undefined, {
    skip: !studentRole,
  });
  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: "pending" },
    { skip: !staffReviewRole }
  );
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery(undefined, {
    skip: !adminRole,
  });
  const { data: globalPaymentsData, isLoading: globalPaymentsLoading } = useGetGlobalPaymentsQuery(undefined, {
    skip: !adminRole,
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
          value: paymentSummary.totalDue || 0,
          loading: myPaymentsLoading,
          hint: `${t("dashboard.stats.student.dueMonthsHint")}: ${paymentSummary.dueCount || 0}`,
        },
      ];
    }

    if (adminRole) {
      return [
        { id: "admin-users", label: t("dashboard.stats.admin.totalUsers"), value: totalUsers, loading: usersLoading },
        {
          id: "admin-courses",
          label: t("dashboard.stats.admin.totalCourses"),
          value: courses.length,
          loading: coursesLoading,
          hint: `${t("dashboard.stats.shared.activeUpcoming")}: ${activeOrUpcomingCourses.length}`,
        },
        { id: "admin-reviews", label: t("dashboard.stats.shared.pendingReviews"), value: pendingReviews, loading: reviewLoading },
        {
          id: "admin-payments",
          label: t("dashboard.stats.admin.globalPayments"),
          value: totalGlobalPayments,
          loading: globalPaymentsLoading,
        },
      ];
    }

      return [
        {
          id: "staff-courses",
          label: t("dashboard.stats.shared.activeUpcomingCourses"),
          value: activeOrUpcomingCourses.length,
          loading: coursesLoading,
        },
      { id: "staff-reviews", label: t("dashboard.stats.shared.pendingReviews"), value: pendingReviews, loading: reviewLoading },
      { id: "staff-total-courses", label: t("dashboard.stats.admin.totalCourses"), value: courses.length, loading: coursesLoading },
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
                <p className="site-kicker">{t("dashboard.kicker")}</p>
                <h1 className="mt-4 text-3xl font-black text-slate-950 [font-family:'Trebuchet_MS','Avenir_Next','Segoe_UI',sans-serif] md:text-4xl">
                  {t(roleCopy.titleKey)}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t(roleCopy.subtitleKey)}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {role ? <RoleBadge role={role} /> : null}
                  {currentUser?.fullName ? (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {currentUser.fullName}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
                      {t("dashboard.profileLoading")}
                    </span>
                  )}
                </div>
              </div>

              <aside className="rounded-[clamp(8px,5%,10px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.07)]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("dashboard.liveSnapshot")}</p>
                <dl className="mt-2 divide-y divide-slate-100">
                  <DetailRow label={t("dashboard.stats.shared.activeUpcoming")} value={coursesLoading ? "..." : activeOrUpcomingCourses.length} />
                  <DetailRow label={t("dashboard.stats.shared.pendingReviews")} value={reviewLoading ? "..." : pendingReviews} />
                  <DetailRow label={t("dashboard.stats.admin.totalCourses")} value={coursesLoading ? "..." : courses.length} />
                </dl>
              </aside>
            </div>
          </header>

          <section className="mt-6">
            <div className={`grid gap-4 ${adminRole ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
              {stats.map((item) => (
                <StatTile
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  hint={item.hint}
                  loading={item.loading}
                  loadingLabel={t("dashboard.loading")}
                />
              ))}
            </div>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,360px)]">
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("dashboard.operations")}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 [font-family:'Trebuchet_MS','Avenir_Next','Segoe_UI',sans-serif] md:text-2xl">
                    {t("dashboard.roleSpecificTools")}
                  </h2>
                </div>
                <span className="rounded-full border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--action-soft-text)]">
                  {actions.length} {t("dashboard.items")}
                </span>
              </div>

              {actions.length === 0 ? (
                <div className="rounded-[clamp(8px,5%,10px)] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {t("dashboard.noRoleActions")}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {actions.map((item) => (
                    <OperationsRow key={item.id} item={item} t={t} />
                  ))}
                </ul>
              )}
            </div>

            <aside className="space-y-4">
              <section className="rounded-[clamp(8px,5%,10px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.07)]">
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
