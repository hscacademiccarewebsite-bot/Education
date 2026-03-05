"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { CardSkeleton, InlineLoader } from "@/components/loaders/AppLoader";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { useUpdateCurrentUserMutation } from "@/lib/features/auth/authApi";
import {
  selectCurrentUser,
  selectCurrentUserDisplayName,
  selectCurrentUserPhotoUrl,
  selectCurrentUserRole,
} from "@/lib/features/user/userSlice";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useGetMyPaymentsQuery } from "@/lib/features/payment/paymentApi";
import { useGetEnrollmentRequestsForReviewQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useGetGlobalPaymentsQuery } from "@/lib/features/payment/paymentApi";
import { useListUsersQuery } from "@/lib/features/user/userApi";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { isAdmin, isStudent } from "@/lib/utils/roleUtils";

/* ─── Role-based theme config ─── */
const ROLE_THEME = {
  admin: {
    gradient: "from-rose-600 via-pink-600 to-fuchsia-500",
    gradientSubtle: "from-rose-50 to-pink-50",
    accent: "text-rose-600",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentRing: "ring-rose-200",
    buttonBg: "bg-rose-600 hover:bg-rose-700",
    statBorder: "border-l-rose-500",
    iconBg: "from-rose-500 to-pink-500",
    title: "Admin Profile",
    subtitle: "Full system control over courses, users, and finance.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  teacher: {
    gradient: "from-sky-600 via-cyan-600 to-teal-500",
    gradientSubtle: "from-sky-50 to-cyan-50",
    accent: "text-sky-600",
    accentBg: "bg-sky-50",
    accentBorder: "border-sky-200",
    accentRing: "ring-sky-200",
    buttonBg: "bg-sky-600 hover:bg-sky-700",
    statBorder: "border-l-sky-500",
    iconBg: "from-sky-500 to-cyan-500",
    title: "Teacher Profile",
    subtitle: "Manage course content and monitor student progress.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  moderator: {
    gradient: "from-indigo-600 via-violet-600 to-purple-500",
    gradientSubtle: "from-indigo-50 to-violet-50",
    accent: "text-indigo-600",
    accentBg: "bg-indigo-50",
    accentBorder: "border-indigo-200",
    accentRing: "ring-indigo-200",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700",
    statBorder: "border-l-indigo-500",
    iconBg: "from-indigo-500 to-violet-500",
    title: "Moderator Profile",
    subtitle: "Coordinate enrollment workflow and support course operations.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  student: {
    gradient: "from-emerald-600 via-teal-600 to-cyan-500",
    gradientSubtle: "from-emerald-50 to-teal-50",
    accent: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentRing: "ring-emerald-200",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700",
    statBorder: "border-l-emerald-500",
    iconBg: "from-emerald-500 to-teal-500",
    title: "Student Profile",
    subtitle: "Enroll in courses, track dues, and access learning content.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
};

const ROLE_ACTIONS = {
  admin: [
    { href: "/dashboard", title: "Open Dashboard", desc: "Go to your admin control panel.", badge: "DASHBOARD", gradient: "from-rose-500 to-pink-500" },
    { href: "/users", title: "Manage Users", desc: "Control user roles and staff assignments.", badge: "USERS", gradient: "from-indigo-500 to-blue-500" },
    { href: "/payments", title: "Global Payments", desc: "View financial records and payment statuses.", badge: "FINANCE", gradient: "from-orange-500 to-amber-500" },
    { href: "/enrollments", title: "Enrollment Review", desc: "Approve or reject enrollment requests.", badge: "REVIEWS", gradient: "from-emerald-500 to-teal-500" },
  ],
  teacher: [
    { href: "/dashboard", title: "Open Dashboard", desc: "Go to your teacher workspace.", badge: "DASHBOARD", gradient: "from-sky-500 to-cyan-500" },
    { href: "/courses", title: "Manage Content", desc: "Maintain subjects, chapters, and video content.", badge: "CONTENT", gradient: "from-cyan-500 to-teal-500" },
    { href: "/enrollments", title: "Review Enrollments", desc: "Process pending student applications.", badge: "REVIEW", gradient: "from-emerald-500 to-teal-500" },
  ],
  moderator: [
    { href: "/dashboard", title: "Open Dashboard", desc: "Go to your moderator workspace.", badge: "DASHBOARD", gradient: "from-indigo-500 to-violet-500" },
    { href: "/courses", title: "Course Coordination", desc: "Maintain course hierarchy and assist operations.", badge: "COURSES", gradient: "from-cyan-500 to-sky-500" },
    { href: "/enrollments", title: "Enrollment Queue", desc: "Handle pending approvals and onboarding.", badge: "QUEUE", gradient: "from-emerald-500 to-teal-500" },
  ],
  student: [
    { href: "/dashboard", title: "Open Dashboard", desc: "Track enrollments and course progress.", badge: "DASHBOARD", gradient: "from-emerald-500 to-teal-500" },
    { href: "/courses", title: "Browse Courses", desc: "Explore available courses and enroll.", badge: "COURSES", gradient: "from-cyan-500 to-sky-500" },
    { href: "/payments", title: "Payment Status", desc: "Check due months and payment records.", badge: "PAY", gradient: "from-orange-500 to-amber-500" },
  ],
};

/* ─── Helpers ─── */
function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:shadow-[0_0_0_4px_rgba(6,182,212,0.08)]";
}

function extractErrorMessage(error) {
  if (!error) return "Request failed.";
  if (typeof error === "string") return error;
  if (error?.data?.message) return error.data.message;
  if (error?.error) return error.error;
  if (error?.message) return error.message;
  return "Request failed.";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/* ─── Sub-components ─── */
function StatCard({ label, value, loading, borderClass, icon }) {
  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] border-l-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <div className="mt-2 min-h-[38px]">
            {loading ? (
              <InlineLoader label="Loading…" className="mt-1" />
            ) : (
              <p className="text-3xl font-black text-slate-900">{value}</p>
            )}
          </div>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ActionCard({ item }) {
  return (
    <Link
      href={item.href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_34px_rgba(15,23,42,0.1)]"
    >
      {/* Gradient accent strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${item.gradient}`} />
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex rounded-full bg-gradient-to-r ${item.gradient} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white`}>
            {item.badge}
          </span>
          <span className="text-xs font-bold text-slate-400 transition group-hover:text-slate-700 group-hover:translate-x-0.5">
            Open →
          </span>
        </div>
        <h3 className="mt-3 text-base font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
      </div>
    </Link>
  );
}

/* ─── Main Page ─── */
export default function ProfilePage() {
  const role = useSelector(selectCurrentUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const displayName = useSelector(selectCurrentUserDisplayName);
  const photoUrl = useSelector(selectCurrentUserPhotoUrl);
  const [updateCurrentUser, { isLoading: savingProfile }] = useUpdateCurrentUserMutation();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    facebookProfileId: "",
  });
  const [profileAsset, setProfileAsset] = useState(null);
  const [imageTouched, setImageTouched] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const studentRole = isStudent(role);
  const adminRole = isAdmin(role);
  const staffRole = role === "teacher" || role === "moderator";

  const theme = ROLE_THEME[role] || ROLE_THEME.student;
  const actions = ROLE_ACTIONS[role] || ROLE_ACTIONS.student;

  useEffect(() => {
    if (!currentUser) return;

    setForm({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      facebookProfileId: currentUser.facebookProfileId || "",
    });
    setProfileAsset(
      currentUser.profilePhoto?.url
        ? { url: currentUser.profilePhoto.url, publicId: currentUser.profilePhoto.publicId || "" }
        : null
    );
    setImageTouched(false);
    setSaveError("");
    setSaveSuccess("");
  }, [currentUser]);

  /* ─ Data queries ─ */
  const { data: myEnrollmentsData, isLoading: myEnrollmentsLoading } = useGetMyEnrollmentRequestsQuery(
    undefined,
    { skip: !studentRole }
  );
  const { data: myPaymentsData, isLoading: myPaymentsLoading } = useGetMyPaymentsQuery(undefined, {
    skip: !studentRole,
  });
  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: "pending" },
    { skip: !staffRole && !adminRole }
  );
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery(undefined, {
    skip: !adminRole,
  });
  const { data: globalPaymentsData, isLoading: globalPaymentsLoading } = useGetGlobalPaymentsQuery(
    undefined,
    { skip: !adminRole }
  );
  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery(undefined, {
    skip: studentRole,
  });

  /* ─ Derived data ─ */
  const enrollments = myEnrollmentsData?.data || [];
  const approvedEnrollments = enrollments.filter((item) => item.status === "approved").length;
  const pendingEnrollments = enrollments.filter((item) => item.status === "pending").length;
  const paymentSummary = myPaymentsData?.summary || { dueCount: 0, totalDue: 0 };
  const pendingReviews = reviewData?.data?.length || 0;
  const totalUsers = usersData?.data?.length || 0;
  const totalGlobalPayments = globalPaymentsData?.data?.length || 0;
  const courses = coursesData?.data || [];
  const activeOrUpcomingCourses = courses.filter((c) => c.status === "active" || c.status === "upcoming");

  /* ─ Profile save logic ─ */
  const originalAsset = currentUser?.profilePhoto?.url
    ? { url: currentUser.profilePhoto.url, publicId: currentUser.profilePhoto.publicId || "" }
    : null;

  const imageChanged =
    imageTouched &&
    ((profileAsset?.url || "") !== (originalAsset?.url || "") ||
      (profileAsset?.publicId || "") !== (originalAsset?.publicId || ""));

  const textChanged = useMemo(() => {
    if (!currentUser) return false;
    return (
      form.fullName.trim() !== String(currentUser.fullName || "").trim() ||
      form.phone.trim() !== String(currentUser.phone || "").trim() ||
      form.facebookProfileId.trim() !== String(currentUser.facebookProfileId || "").trim()
    );
  }, [currentUser, form.facebookProfileId, form.fullName, form.phone]);

  const canSaveProfile = Boolean(currentUser) && (textChanged || imageChanged) && !savingProfile;
  const previewPhotoUrl = imageTouched ? profileAsset?.url || "" : photoUrl;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    setSaveSuccess("");
    setSaveError("");

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      facebookProfileId: form.facebookProfileId.trim(),
    };
    if (!payload.fullName) {
      setSaveError("Full name is required.");
      return;
    }

    if (imageChanged) {
      if (profileAsset?.url) {
        payload.profilePhoto = { url: profileAsset.url, publicId: profileAsset.publicId || "" };
      } else if (originalAsset?.url) {
        payload.removeProfilePhoto = true;
      }
    }

    try {
      await updateCurrentUser(payload).unwrap();
      setSaveSuccess("Profile updated successfully.");
      setImageTouched(false);
    } catch (error) {
      setSaveError(extractErrorMessage(error));
    }
  };

  const handleProfileReset = () => {
    if (!currentUser) return;
    setForm({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      facebookProfileId: currentUser.facebookProfileId || "",
    });
    setProfileAsset(
      currentUser.profilePhoto?.url
        ? { url: currentUser.profilePhoto.url, publicId: currentUser.profilePhoto.publicId || "" }
        : null
    );
    setImageTouched(false);
    setSaveError("");
    setSaveSuccess("");
  };

  /* ─ Build stats per role ─ */
  const stats = useMemo(() => {
    if (studentRole) {
      return [
        {
          label: "Approved Courses",
          value: approvedEnrollments,
          loading: myEnrollmentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
          label: "Pending Requests",
          value: pendingEnrollments,
          loading: myEnrollmentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
          label: "Due Months",
          value: paymentSummary.dueCount || 0,
          loading: myPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
        },
        {
          label: "Total Due (BDT)",
          value: `৳${paymentSummary.totalDue || 0}`,
          loading: myPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
        },
      ];
    }

    if (adminRole) {
      return [
        {
          label: "Total Users",
          value: totalUsers,
          loading: usersLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
        },
        {
          label: "Total Courses",
          value: courses.length,
          loading: coursesLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
        },
        {
          label: "Pending Reviews",
          value: pendingReviews,
          loading: reviewLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
        },
        {
          label: "Global Payments",
          value: totalGlobalPayments,
          loading: globalPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
        },
      ];
    }

    // Teacher / Moderator
    return [
      {
        label: "Active/Upcoming Courses",
        value: activeOrUpcomingCourses.length,
        loading: coursesLoading,
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
      },
      {
        label: "Pending Reviews",
        value: pendingReviews,
        loading: reviewLoading,
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
      },
      {
        label: "Total Courses",
        value: courses.length,
        loading: coursesLoading,
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>,
      },
    ];
  }, [
    activeOrUpcomingCourses.length,
    adminRole,
    approvedEnrollments,
    courses.length,
    coursesLoading,
    globalPaymentsLoading,
    myEnrollmentsLoading,
    myPaymentsLoading,
    paymentSummary.dueCount,
    paymentSummary.totalDue,
    pendingEnrollments,
    pendingReviews,
    reviewLoading,
    studentRole,
    totalGlobalPayments,
    totalUsers,
    usersLoading,
  ]);

  return (
    <RequireAuth>
      <section className="min-h-screen bg-slate-50">
        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden bg-slate-900">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20" />
            <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white/15" />
            <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white/10" />
          </div>

          <div className="container-page relative z-10 pb-24 pt-10 md:pb-28 md:pt-12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-white/90 backdrop-blur-sm">
                  {theme.icon}
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">My Profile</span>
                </div>
                <h1 className="mt-4 text-3xl font-black text-white md:text-4xl [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                  {theme.title}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">{theme.subtitle}</p>
              </div>
              {currentUser?.createdAt ? (
                <div className="hidden rounded-xl bg-white/10 px-4 py-2.5 text-right backdrop-blur-sm md:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Member since</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{formatDate(currentUser.createdAt)}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Profile Identity Card (overlaps banner) ── */}
        <div className="container-page relative z-20 -mt-16 md:-mt-20">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-8">
            <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-8">
              {/* Avatar */}
              <div className="shrink-0">
                <div className={`rounded-full p-1 bg-gradient-to-br ${theme.gradient}`}>
                  {previewPhotoUrl ? (
                    <img
                      src={previewPhotoUrl}
                      alt={displayName || "User"}
                      className="h-28 w-28 rounded-full border-4 border-white object-cover md:h-32 md:w-32"
                    />
                  ) : (
                    <div className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br ${theme.iconBg} text-3xl font-black text-white md:h-32 md:w-32`}>
                      {initialsFromName(displayName) || "U"}
                    </div>
                  )}
                </div>
              </div>

              {/* Identity details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
                  <h2 className="text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-3xl">
                    {displayName || "Loading…"}
                  </h2>
                  {role ? <RoleBadge role={role} /> : null}
                  {currentUser?.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : currentUser ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Inactive
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm text-slate-500">{currentUser?.email || ""}</p>
                {currentUser?.phone ? (
                  <p className="mt-0.5 text-sm text-slate-500">Phone: {currentUser.phone}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="container-page pb-12 pt-6">
          {/* ── Stats Dashboard ── */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              Overview
            </h2>
            <div className={`grid gap-4 ${stats.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
              {stats.map((item, idx) => (
                <StatCard
                  key={idx}
                  label={item.label}
                  value={item.value}
                  loading={item.loading}
                  borderClass={theme.statBorder}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          {/* ── Edit Profile Section ── */}
          <div className="mb-8">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)] md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${theme.iconBg} text-white`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-500">Update your profile details and photo</p>
                </div>
              </div>

              {!currentUser ? (
                <CardSkeleton />
              ) : (
                <form onSubmit={handleProfileSave}>
                  <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
                    {/* Photo upload column */}
                    <div>
                      <ImageUploadField
                        label="Profile Photo"
                        folder="hsc-academic/profiles"
                        asset={profileAsset}
                        previewAlt="Profile image preview"
                        className="border-slate-200 bg-slate-50/80"
                        onChange={(asset) => {
                          setProfileAsset(
                            asset?.url ? { url: asset.url, publicId: asset.publicId || "" } : null
                          );
                          setImageTouched(true);
                          setSaveError("");
                          setSaveSuccess("");
                        }}
                      />
                      {imageChanged ? (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                          New image selected. Click Save Profile to store it.
                        </p>
                      ) : null}
                    </div>

                    {/* Form fields column */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          value={form.fullName}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, fullName: e.target.value }));
                            setSaveError("");
                            setSaveSuccess("");
                          }}
                          className={fieldClass()}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Email
                        </label>
                        <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                          {currentUser.email || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Phone
                        </label>
                        <input
                          value={form.phone}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, phone: e.target.value }));
                            setSaveError("");
                            setSaveSuccess("");
                          }}
                          className={fieldClass()}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Facebook Profile ID
                        </label>
                        <input
                          value={form.facebookProfileId}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, facebookProfileId: e.target.value }));
                            setSaveError("");
                            setSaveSuccess("");
                          }}
                          className={fieldClass()}
                          placeholder="Facebook profile ID"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback messages */}
                  {saveError ? (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      {saveError}
                    </div>
                  ) : null}
                  {saveSuccess ? (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {saveSuccess}
                    </div>
                  ) : null}

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      disabled={!canSaveProfile}
                      className={`rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wide text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${theme.buttonBg}`}
                    >
                      {savingProfile ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving…
                        </span>
                      ) : (
                        "Save Profile"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleProfileReset}
                      disabled={savingProfile}
                      className="rounded-xl border border-slate-300 px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div>
            <h2 className="mb-4 text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              Quick Actions
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {actions.map((item, idx) => (
                <ActionCard key={idx} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </RequireAuth>
  );
}
