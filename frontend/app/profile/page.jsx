"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { CardSkeleton, InlineLoader } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import Avatar from "@/components/Avatar";
import { FloatingInput } from "@/components/forms/FloatingField";
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
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

/* ─── Role-based theme config ─── */
const ROLE_THEME = {
  admin: {
    gradient: "from-rose-600 via-pink-600 to-fuchsia-500",
    gradientSubtle: "from-rose-50 to-pink-50",
    accent: "text-rose-600",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentRing: "ring-rose-200",
    statBorder: "border-l-rose-500",
    iconBg: "from-rose-500 to-pink-500",
    titleKey: "profilePage.roles.adminTitle",
    defaultTitle: "Admin Profile",
    subtitleKey: "profilePage.roles.adminDesc",
    defaultSubtitle: "Full system control over courses, users, and finance.",
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
    statBorder: "border-l-sky-500",
    iconBg: "from-sky-500 to-cyan-500",
    titleKey: "profilePage.roles.teacherTitle",
    defaultTitle: "Teacher Profile",
    subtitleKey: "profilePage.roles.teacherDesc",
    defaultSubtitle: "Manage course content and monitor student progress.",
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
    statBorder: "border-l-indigo-500",
    iconBg: "from-indigo-500 to-violet-500",
    titleKey: "profilePage.roles.moderatorTitle",
    defaultTitle: "Moderator Profile",
    subtitleKey: "profilePage.roles.moderatorDesc",
    defaultSubtitle: "Coordinate enrollment workflow and support course operations.",
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
    statBorder: "border-l-emerald-500",
    iconBg: "from-emerald-500 to-teal-500",
    titleKey: "profilePage.roles.studentTitle",
    defaultTitle: "Student Profile",
    subtitleKey: "profilePage.roles.studentDesc",
    defaultSubtitle: "Enroll in courses, track dues, and access learning content.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
};


function extractErrorMessage(error, t) {
  if (!error) return t("profilePage.messages.requestFailed", "Request failed.");
  if (typeof error === "string") return error;
  if (error?.data?.message) return error.data.message;
  if (error?.error) return error.error;
  if (error?.message) return error.message;
  return t("profilePage.messages.requestFailed", "Request failed.");
}

function formatDate(dateString, t) {
  if (!dateString) return t("profilePage.misc.na", "N/A");
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/* ─── Sub-components ─── */
function StatCard({ label, value, loading, borderClass, icon, t }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-3 md:p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)] border-l-4 ${borderClass} transition-all`}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <div className="mt-1 md:mt-2 min-h-[32px] md:min-h-[38px]">
            {loading ? (
              <InlineLoader label={t ? t("profilePage.misc.loading", "Loading…") : "Loading…"} className="mt-1" />
            ) : (
              <p className="text-lg md:text-xl font-extrabold text-slate-900">{value}</p>
            )}
          </div>
        </div>
        {icon ? (
          <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            {icon && Object.assign({}, icon, { props: { ...icon.props, className: "h-4 w-4 md:h-5 md:w-5" } })}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* ─── Main Page ─── */
export default function ProfilePage() {
  const { t } = useSiteLanguage();
  const role = useSelector(selectCurrentUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const displayName = useSelector(selectCurrentUserDisplayName);
  const photoUrl = useSelector(selectCurrentUserPhotoUrl);
  const [updateCurrentUser, { isLoading: savingProfile }] = useUpdateCurrentUserMutation();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    facebookProfileId: "",
    varsity: "",
    experience: "",
  });
  const [profileAsset, setProfileAsset] = useState(null);
  const [imageTouched, setImageTouched] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();

  const studentRole = isStudent(role);
  const adminRole = isAdmin(role);
  const staffRole = role === "teacher" || role === "moderator";

  const theme = ROLE_THEME[role] || ROLE_THEME.student;

  useEffect(() => {
    if (!currentUser) return;

    setForm({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      facebookProfileId: currentUser.facebookProfileId || "",
      varsity: currentUser.varsity || "",
      experience: currentUser.experience || "",
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
      form.facebookProfileId.trim() !== String(currentUser.facebookProfileId || "").trim() ||
      form.varsity.trim() !== String(currentUser.varsity || "").trim() ||
      form.experience.trim() !== String(currentUser.experience || "").trim()
    );
  }, [currentUser, form.facebookProfileId, form.fullName, form.phone, form.varsity, form.experience]);

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
      varsity: form.varsity.trim(),
      experience: form.experience.trim(),
    };
    if (!payload.fullName) {
      const validationMessage = t("profilePage.messages.nameReq", "Full name is required.");
      setSaveError(validationMessage);
      showError(validationMessage);
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
      setSaveSuccess(t("profilePage.messages.updateSuccess", "Profile updated successfully."));
      showSuccess(t("profilePage.messages.updateSuccess", "Profile updated successfully."));
      setImageTouched(false);
    } catch (error) {
      const resolvedError = extractErrorMessage(error, t);
      setSaveError(resolvedError);
      showError(resolvedError);
    }
  };

  const handleProfileReset = () => {
    if (!currentUser) return;
    setForm({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      facebookProfileId: currentUser.facebookProfileId || "",
      varsity: currentUser.varsity || "",
      experience: currentUser.experience || "",
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
          label: t("profilePage.stats.approved", "Approved Courses"),
          value: approvedEnrollments,
          loading: myEnrollmentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
          label: t("profilePage.stats.pendingReqs", "Pending Requests"),
          value: pendingEnrollments,
          loading: myEnrollmentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
        {
          label: t("profilePage.stats.dueMonths", "Due Months"),
          value: paymentSummary.dueCount || 0,
          loading: myPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
        },
        {
          label: t("profilePage.stats.totalDue", "Total Due (BDT)"),
          value: `৳${paymentSummary.totalDue || 0}`,
          loading: myPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
        },
      ];
    }

    if (adminRole) {
      return [
        {
          label: t("profilePage.stats.totalUsers", "Total Users"),
          value: totalUsers,
          loading: usersLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
        },
        {
          label: t("profilePage.stats.totalCourses", "Total Courses"),
          value: courses.length,
          loading: coursesLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
        },
        {
          label: t("profilePage.stats.pendingReviews", "Pending Reviews"),
          value: pendingReviews,
          loading: reviewLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
        },
        {
          label: t("profilePage.stats.globalPayments", "Global Payments"),
          value: totalGlobalPayments,
          loading: globalPaymentsLoading,
          icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
        },
      ];
    }

    // Teacher / Moderator
    return [
      {
        label: t("profilePage.stats.activeCourses", "Active/Upcoming Courses"),
        value: activeOrUpcomingCourses.length,
        loading: coursesLoading,
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
      },
      {
        label: t("profilePage.stats.pendingReviews", "Pending Reviews"),
        value: pendingReviews,
        loading: reviewLoading,
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
      },
      {
        label: t("profilePage.stats.totalCourses", "Total Courses"),
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
      <section className="site-shell min-h-screen pb-14">
        <div className="container-page py-8 md:py-10">

          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <RevealSection noStagger>
              <RevealItem as="aside" className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 md:p-6 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col items-center text-center">
                  <div className={`rounded-full p-0.5 md:p-1 bg-gradient-to-br ${theme.gradient}`}>
                    <Avatar
                      src={previewPhotoUrl}
                      name={displayName || "User"}
                      className="h-20 w-20 rounded-full border-2 md:border-4 border-white md:h-28 md:w-28"
                      fallbackClassName={`bg-gradient-to-br ${theme.iconBg} text-base md:text-lg font-extrabold text-white`}
                    />
                  </div>

                  <h2 className="mt-2 md:mt-3 text-lg md:text-xl font-extrabold text-slate-950 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                    {displayName || t("profilePage.misc.loading", "Loading…")}
                  </h2>
                  <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-400 font-medium">{currentUser?.email || ""}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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

                <dl className="mt-4 md:mt-5 space-y-2 md:space-y-3 border-t border-slate-200 pt-3 md:pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{t("profilePage.form.phone", "Phone")}</dt>
                    <dd className="text-xs md:text-sm font-semibold text-slate-700">{currentUser?.phone || t("profilePage.misc.notSet", "Not set")}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{t("profilePage.form.facebookId", "Facebook ID")}</dt>
                    <dd className="truncate text-xs md:text-sm font-semibold text-slate-700">
                      {currentUser?.facebookProfileId || t("profilePage.misc.notSet", "Not set")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{t("profilePage.form.role", "Role")}</dt>
                    <dd className="text-xs md:text-sm font-semibold capitalize text-slate-700">{role || t("profilePage.misc.studentFallback", "student")}</dd>
                  </div>
                </dl>
              </RevealItem>
            </RevealSection>

            <RevealSection className="space-y-6">
              <section>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{t("profilePage.layout.overview", "Overview")}</p>
                <RevealSection className={`mt-3 grid grid-cols-2 gap-3 md:gap-4 ${stats.length === 4 ? "xl:grid-cols-4" : "md:grid-cols-3"}`}>
                  {stats.map((item, idx) => (
                    <RevealItem key={idx}>
                      <StatCard
                        label={item.label}
                        value={item.value}
                        loading={item.loading}
                        borderClass={theme.statBorder}
                        icon={item.icon}
                        t={t}
                      />
                    </RevealItem>
                  ))}
                </RevealSection>
              </section>

              <RevealItem as="section" className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] md:p-6">
                <div className="mb-4 md:mb-5 flex items-center gap-3">
                  <div className={`flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br ${theme.iconBg} text-white`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-extrabold text-slate-950 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                      {t("profilePage.layout.personalInfo", "Personal Information")}
                    </h2>
                    <p className="text-[11px] md:text-xs text-slate-500">{t("profilePage.layout.updateDesc", "Update your profile details and photo.")}</p>
                  </div>
                </div>

                {!currentUser ? (
                  <CardSkeleton />
                ) : (
                  <form onSubmit={handleProfileSave}>
                    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
                      <div>
                        <ImageUploadField
                          label={t("profilePage.form.profilePhoto", "Profile Photo")}
                          folder="hsc-academic/profiles"
                          asset={profileAsset}
                          previewAlt={t("profilePage.form.photoAlt", "Profile image preview")}
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
                            {t("profilePage.form.newImageNotice", "New image selected. Click Save Profile to store it.")}
                          </p>
                        ) : null}
                      </div>

                        <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <FloatingInput
                            required
                            label={t("profilePage.form.fullName", "Full Name")}
                            value={form.fullName}
                            onChange={(e) => {
                              setForm((prev) => ({ ...prev, fullName: e.target.value }));
                              setSaveError("");
                              setSaveSuccess("");
                            }}
                            hint={t("profilePage.form.nameHint", "Your full name")}
                          />
                        </div>

                        <div className="min-h-[72px]">
                          <div className="relative rounded-xl border border-slate-300 bg-slate-50 px-3 pt-5 pb-2 text-sm text-slate-600">
                            <p className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--action-start)]">
                              {t("profilePage.form.email", "Email")}
                            </p>
                            <p className="truncate">{currentUser.email || t("profilePage.misc.notProvided", "Not provided")}</p>
                          </div>
                          <div className="mt-1.5 min-h-[18px]" />
                        </div>

                        <div>
                          <FloatingInput
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => {
                              setForm((prev) => ({ ...prev, phone: e.target.value }));
                              setSaveError("");
                              setSaveSuccess("");
                            }}
                            hint={t("profilePage.form.phoneHint", "Phone number")}
                          />
                        </div>

                        <div>
                          <FloatingInput
                            label={t("profilePage.form.fbId", "Facebook Profile ID")}
                            value={form.facebookProfileId}
                            onChange={(e) => {
                              setForm((prev) => ({ ...prev, facebookProfileId: e.target.value }));
                              setSaveError("");
                              setSaveSuccess("");
                            }}
                            hint={t("profilePage.form.fbHint", "Facebook profile ID")}
                          />
                        </div>

                        {staffRole && (
                          <>
                            <div>
                              <FloatingInput
                                label={t("profilePage.form.varsity", "Varsity / University")}
                                value={form.varsity}
                                onChange={(e) => {
                                  setForm((prev) => ({ ...prev, varsity: e.target.value }));
                                  setSaveError("");
                                  setSaveSuccess("");
                                }}
                                hint={t("profilePage.form.varsityHint", "University info for homepage card")}
                              />
                            </div>
                            <div>
                              <FloatingInput
                                label={t("profilePage.form.experience", "Experience")}
                                value={form.experience}
                                onChange={(e) => {
                                  setForm((prev) => ({ ...prev, experience: e.target.value }));
                                  setSaveError("");
                                  setSaveSuccess("");
                                }}
                                hint={t("profilePage.form.experienceHint", "e.g. '12+ Years of Experience'")}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {saveError ? (
                      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                        {saveError}
                      </div>
                    ) : null}

                    {saveSuccess ? (
                      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {saveSuccess}
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        disabled={!canSaveProfile}
                        className="site-button-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {savingProfile ? t("profilePage.actions.saving", "Saving...") : t("profilePage.actions.saveProfile", "Save Profile")}
                      </button>
                      <button
                        type="button"
                        onClick={handleProfileReset}
                        disabled={savingProfile}
                        className="site-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t("profilePage.actions.reset", "Reset")}
                      </button>
                    </div>
                  </form>
                )}
              </RevealItem>
            </RevealSection>
          </div>
        </div>
      </section>
      {popupNode}
    </RequireAuth>
  );
}
