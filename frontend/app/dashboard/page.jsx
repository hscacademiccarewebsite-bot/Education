"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import PageHero from "@/components/layouts/PageHero";
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
    title: "Admin Command Center",
    subtitle: "Control academic structure, homepage settings, enrollments, users, and finance from one operational workspace.",
  },
  teacher: {
    title: "Teacher Workspace",
    subtitle: "Monitor course structure, review enrollments, and keep faculty delivery consistent.",
  },
  moderator: {
    title: "Moderator Workspace",
    subtitle: "Coordinate enrollment operations, assist staff workflows, and maintain course continuity.",
  },
  student: {
    title: "Student Workspace",
    subtitle: "Track your approvals, payments, and active academic journey in one place.",
  },
};

const ROLE_ACTIONS = {
  admin: [
    { id: "admin-courses", title: "Manage Courses", description: "Create, edit, and structure courses with subjects, chapters, and videos.", href: "/courses", accent: "from-cyan-500 to-sky-500", badge: "COURSES" },
    { id: "admin-slider-control", title: "Homepage Slider", description: "Manage hero images and slider priority for the homepage.", href: "/dashboard/slider-control", accent: "from-violet-500 to-fuchsia-500", badge: "SLIDER" },
    { id: "admin-site-settings", title: "Site Settings", description: "Update brand identity, about content, contact details, and footer copy.", href: "/dashboard/site-settings", accent: "from-teal-500 to-cyan-600", badge: "SETTINGS" },
    { id: "admin-enrollments", title: "Enrollment Review", description: "Approve or reject applications and verify student onboarding details.", href: "/enrollments", accent: "from-emerald-500 to-teal-500", badge: "REVIEWS" },
    { id: "admin-users", title: "Manage Users", description: "Assign roles, control staff access, and keep permissions aligned.", href: "/users", accent: "from-indigo-500 to-blue-500", badge: "USERS" },
    { id: "admin-payments", title: "Global Payments", description: "Inspect financial records and verify payment state across all courses.", href: "/payments", accent: "from-orange-500 to-amber-500", badge: "FINANCE" },
  ],
  teacher: [
    { id: "teacher-courses", title: "Manage Course Content", description: "Update subjects, chapters, and video delivery under assigned courses.", href: "/courses", accent: "from-cyan-500 to-sky-500", badge: "CONTENT" },
    { id: "teacher-enrollments", title: "Review Enrollments", description: "Process student applications and confirm onboarding flow.", href: "/enrollments", accent: "from-emerald-500 to-teal-500", badge: "REVIEW" },
    { id: "teacher-payments", title: "Payment Updates", description: "Mark offline payments when students pay outside the gateway.", href: "/payments", accent: "from-orange-500 to-amber-500", badge: "PAYMENTS" },
  ],
  moderator: [
    { id: "moderator-courses", title: "Course Coordination", description: "Maintain the course tree and support content operations.", href: "/courses", accent: "from-cyan-500 to-sky-500", badge: "COURSES" },
    { id: "moderator-enrollments", title: "Enrollment Queue", description: "Keep the approval pipeline moving without ambiguity.", href: "/enrollments", accent: "from-emerald-500 to-teal-500", badge: "QUEUE" },
    { id: "moderator-payments", title: "Payment Assistance", description: "Support manual payment verification and issue follow-up.", href: "/payments", accent: "from-orange-500 to-amber-500", badge: "FINANCE" },
  ],
  student: [
    { id: "student-courses", title: "Browse Courses", description: "Explore current offerings and enter your approved learning spaces.", href: "/courses", accent: "from-cyan-500 to-sky-500", badge: "COURSES" },
    { id: "student-enrollments", title: "My Enrollments", description: "See whether your applications are pending, approved, or rejected.", href: "/enrollments", accent: "from-emerald-500 to-teal-500", badge: "ENROLL" },
    { id: "student-payments", title: "My Payments", description: "Track dues, paid months, and current financial status.", href: "/payments", accent: "from-orange-500 to-amber-500", badge: "PAY" },
  ],
};

function StatCard({ label, value, loading = false, hint = "" }) {
  return (
    <article className="site-stat-tile rounded-[30px]">
      <p className="site-stat-label">{label}</p>
      <div className="mt-3 min-h-[44px]">
        {loading ? <InlineLoader label="Loading..." /> : <p className="site-stat-value mt-0">{value}</p>}
      </div>
      {hint ? <p className="site-stat-hint">{hint}</p> : null}
    </article>
  );
}

function ActionCard({ item }) {
  return (
    <Link
      href={item.href}
      className="site-panel group overflow-hidden rounded-[30px] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.1)]"
    >
      <div className={`h-1.5 bg-gradient-to-r ${item.accent}`} />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex rounded-full bg-gradient-to-r ${item.accent} px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white`}>
            {item.badge}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 transition group-hover:text-slate-700">
            Open
          </span>
        </div>
        <h3 className="font-display mt-4 text-xl font-black text-slate-950">{item.title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
      </div>
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
        { id: "student-approved", label: "Approved Courses", value: approvedCount, loading: myEnrollmentsLoading },
        { id: "student-pending", label: "Pending Requests", value: pendingCount, loading: myEnrollmentsLoading },
        { id: "student-due-amount", label: "Due Amount (BDT)", value: paymentSummary.totalDue || 0, loading: myPaymentsLoading, hint: `Due months: ${paymentSummary.dueCount || 0}` },
      ];
    }

    if (adminRole) {
      return [
        { id: "admin-users", label: "Total Users", value: totalUsers, loading: usersLoading },
        { id: "admin-courses", label: "Total Courses", value: courses.length, loading: coursesLoading, hint: `Active/Upcoming: ${activeOrUpcomingCourses.length}` },
        { id: "admin-reviews", label: "Pending Reviews", value: pendingReviews, loading: reviewLoading },
        { id: "admin-payments", label: "Global Payments", value: totalGlobalPayments, loading: globalPaymentsLoading },
      ];
    }

    return [
      { id: "staff-courses", label: "Active/Upcoming Courses", value: activeOrUpcomingCourses.length, loading: coursesLoading },
      { id: "staff-reviews", label: "Pending Reviews", value: pendingReviews, loading: reviewLoading },
      { id: "staff-total-courses", label: "Total Courses", value: courses.length, loading: coursesLoading },
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
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Role Workspace"
          title={roleCopy.title}
          description={roleCopy.subtitle}
          actions={
            <>
              {currentUser?.fullName ? (
                <div className="site-panel-muted rounded-full px-4 py-3 text-sm font-semibold text-slate-700">
                  {currentUser.fullName}
                </div>
              ) : (
                <div className="site-panel-muted rounded-full px-4 py-3">
                  <InlineLoader label="Loading user..." />
                </div>
              )}
              {role ? <RoleBadge role={role} /> : null}
            </>
          }
          aside={
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                Snapshot
              </p>
              <div className="mt-4 space-y-3 text-white">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Live Courses</p>
                  <p className="mt-2 text-3xl font-black">{activeOrUpcomingCourses.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Pending Reviews</p>
                  <p className="mt-2 text-3xl font-black">{pendingReviews}</p>
                </div>
              </div>
            </div>
          }
        />

        <div className={`site-grid mt-6 ${adminRole ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
          {stats.map((item) => (
            <StatCard
              key={item.id}
              label={item.label}
              value={item.value}
              loading={item.loading}
              hint={item.hint}
            />
          ))}
        </div>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="site-kicker">Action Deck</p>
              <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                Choose your next operation
              </h2>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Role-specific tools
            </p>
          </div>

          {actions.length === 0 ? (
            <div className="site-panel rounded-[30px] p-5 text-sm text-slate-600">
              No role-specific actions configured.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {actions.map((item) => (
                <ActionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </section>
    </RequireAuth>
  );
}
