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

const ROLE_COPY = {
  admin: {
    title: "Admin Dashboard",
    subtitle: "Platform-wide control panel for operations, academic content, users, and finance.",
  },
  teacher: {
    title: "Teacher Dashboard",
    subtitle: "Manage course content, monitor enrollments, and support student progress.",
  },
  moderator: {
    title: "Moderator Dashboard",
    subtitle: "Review requests, coordinate student support, and keep course operations on track.",
  },
  student: {
    title: "Student Dashboard",
    subtitle: "Track your enrollments, payments, and access your active courses quickly.",
  },
};

const ROLE_ACTIONS = {
  admin: [
    {
      id: "admin-courses",
      title: "Manage Courses",
      description: "Create, edit, and structure courses with subjects, chapters, and videos.",
      href: "/courses",
      accent: "from-cyan-500 to-sky-500",
      badge: "COURSES",
    },
    {
      id: "admin-slider-control",
      title: "Homepage Slider",
      description:
        "Create, edit, delete, and prioritize hero image sliders with dynamic button settings.",
      href: "/dashboard/slider-control",
      accent: "from-violet-500 to-fuchsia-500",
      badge: "SLIDER",
    },
    {
      id: "admin-site-settings",
      title: "Site Settings",
      description: "Manage global branding, about section, and contact information.",
      href: "/dashboard/site-settings",
      accent: "from-indigo-500 to-cyan-500",
      badge: "SETTINGS",
    },
    {
      id: "admin-enrollments",
      title: "Enrollment Review",
      description: "Approve or reject pending student enrollment requests.",
      href: "/enrollments",
      accent: "from-emerald-500 to-teal-500",
      badge: "REVIEWS",
    },
    {
      id: "admin-users",
      title: "Manage Users",
      description: "Control user roles and staff assignments across courses.",
      href: "/users",
      accent: "from-indigo-500 to-blue-500",
      badge: "USERS",
    },
    {
      id: "admin-payments",
      title: "Global Payments",
      description: "View financial records and verify online/offline payment statuses.",
      href: "/payments",
      accent: "from-orange-500 to-amber-500",
      badge: "FINANCE",
    },
  ],
  teacher: [
    {
      id: "teacher-courses",
      title: "Manage Course Content",
      description: "Open courses and maintain subjects, chapters, and video content.",
      href: "/courses",
      accent: "from-cyan-500 to-sky-500",
      badge: "CONTENT",
    },
    {
      id: "teacher-enrollments",
      title: "Review Enrollments",
      description: "Process pending student applications and update status.",
      href: "/enrollments",
      accent: "from-emerald-500 to-teal-500",
      badge: "REVIEW",
    },
    {
      id: "teacher-payments",
      title: "Payment Updates",
      description: "Update payment status for students who paid offline.",
      href: "/payments",
      accent: "from-orange-500 to-amber-500",
      badge: "PAYMENTS",
    },
  ],
  moderator: [
    {
      id: "moderator-courses",
      title: "Course Coordination",
      description: "Maintain course hierarchy and assist with content operations.",
      href: "/courses",
      accent: "from-cyan-500 to-sky-500",
      badge: "COURSES",
    },
    {
      id: "moderator-enrollments",
      title: "Enrollment Queue",
      description: "Handle pending approvals and student onboarding flow.",
      href: "/enrollments",
      accent: "from-emerald-500 to-teal-500",
      badge: "QUEUE",
    },
    {
      id: "moderator-payments",
      title: "Payment Assistance",
      description: "Mark offline payment completion when student confirms payment.",
      href: "/payments",
      accent: "from-orange-500 to-amber-500",
      badge: "FINANCE",
    },
  ],
  student: [
    {
      id: "student-courses",
      title: "Browse Courses",
      description: "Explore available courses and open your approved course spaces.",
      href: "/courses",
      accent: "from-cyan-500 to-sky-500",
      badge: "COURSES",
    },
    {
      id: "student-enrollments",
      title: "My Enrollments",
      description: "Track pending and approved enrollment requests.",
      href: "/enrollments",
      accent: "from-emerald-500 to-teal-500",
      badge: "ENROLL",
    },
    {
      id: "student-payments",
      title: "My Payments",
      description: "Check due months and completed payment records.",
      href: "/payments",
      accent: "from-orange-500 to-amber-500",
      badge: "PAY",
    },
  ],
};

function StatCard({ label, value, loading = false, toneClass = "text-slate-900", hint = "" }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 min-h-[38px]">
        {loading ? (
          <InlineLoader label="Loading..." className="mt-1" />
        ) : (
          <p className={`text-3xl font-black ${toneClass}`}>{value}</p>
        )}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function ActionCard({ item }) {
  return (
    <Link
      href={item.href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full bg-gradient-to-r ${item.accent} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white`}
        >
          {item.badge}
        </span>
        <span className="text-xs font-bold text-slate-500 transition group-hover:text-slate-700">Open</span>
      </div>
      <h3 className="mt-3 text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentUserRole);

  const studentRole = isStudent(role);
  const adminRole = isAdmin(role);
  const staffReviewRole = role === "teacher" || role === "moderator" || role === "admin";

  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery();
  const { data: myEnrollmentsData, isLoading: myEnrollmentsLoading } = useGetMyEnrollmentRequestsQuery(
    undefined,
    { skip: !studentRole }
  );
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

  const { data: globalPaymentsData, isLoading: globalPaymentsLoading } = useGetGlobalPaymentsQuery(
    undefined,
    { skip: !adminRole }
  );

  const roleCopy = ROLE_COPY[role] || {
    title: "Dashboard",
    subtitle: "Your role-based workspace.",
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
        {
          id: "student-approved",
          label: "Approved Courses",
          value: approvedCount,
          loading: myEnrollmentsLoading,
          toneClass: "text-emerald-700",
        },
        {
          id: "student-pending",
          label: "Pending Requests",
          value: pendingCount,
          loading: myEnrollmentsLoading,
          toneClass: "text-amber-600",
        },
        {
          id: "student-due-amount",
          label: "Due Amount (BDT)",
          value: paymentSummary.totalDue || 0,
          loading: myPaymentsLoading,
          toneClass: "text-rose-600",
          hint: `Due months: ${paymentSummary.dueCount || 0}`,
        },
      ];
    }

    if (adminRole) {
      return [
        {
          id: "admin-users",
          label: "Total Users",
          value: totalUsers,
          loading: usersLoading,
          toneClass: "text-slate-900",
        },
        {
          id: "admin-courses",
          label: "Total Courses",
          value: courses.length,
          loading: coursesLoading,
          toneClass: "text-cyan-700",
          hint: `Active/Upcoming: ${activeOrUpcomingCourses.length}`,
        },
        {
          id: "admin-reviews",
          label: "Pending Reviews",
          value: pendingReviews,
          loading: reviewLoading,
          toneClass: "text-amber-600",
        },
        {
          id: "admin-payments",
          label: "Global Payments",
          value: totalGlobalPayments,
          loading: globalPaymentsLoading,
          toneClass: "text-indigo-700",
        },
      ];
    }

    return [
      {
        id: "staff-courses",
        label: "Active/Upcoming Courses",
        value: activeOrUpcomingCourses.length,
        loading: coursesLoading,
        toneClass: "text-cyan-700",
      },
      {
        id: "staff-reviews",
        label: "Pending Reviews",
        value: pendingReviews,
        loading: reviewLoading,
        toneClass: "text-amber-600",
      },
      {
        id: "staff-total-courses",
        label: "Total Courses",
        value: courses.length,
        loading: coursesLoading,
        toneClass: "text-slate-900",
      },
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
    usersLoading,
  ]);

  return (
    <RequireAuth>
      <section className="container-page py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)] md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
            {roleCopy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{roleCopy.subtitle}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {currentUser?.fullName ? (
              <p className="text-sm font-semibold text-slate-700">{currentUser.fullName}</p>
            ) : (
              <InlineLoader label="Loading user..." />
            )}
            {role ? <RoleBadge role={role} /> : null}
          </div>
        </div>

        <div className={`mt-6 grid gap-4 ${adminRole ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
          {stats.map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              loading={item.loading}
              toneClass={item.toneClass}
              hint={item.hint}
            />
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              What do you want to do?
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Role Actions</p>
          </div>

          {actions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              No role-specific actions configured.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {actions.map((item) => (
                <ActionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}
