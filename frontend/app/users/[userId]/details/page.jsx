"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import Avatar from "@/components/Avatar";
import { useReviewEnrollmentRequestMutation } from "@/lib/features/enrollment/enrollmentApi";
import { useGetUserDetailsQuery } from "@/lib/features/user/userApi";
import { ROLES } from "@/lib/utils/roleUtils";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";


function formatDateTime(value, t, language) {
  if (!value) return t ? t("userDetails.misc.na", "N/A") : "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t ? t("userDetails.misc.na", "N/A") : "N/A";
  return date.toLocaleString(language === "bn" ? "bn-BD" : "en-US");
}

function formatAmount(value, language, currency = "BDT") {
  return `${new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(Number(value || 0))} ${currency}`;
}

function enrollmentStatusClass(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function paymentStatusClass(status) {
  if (status === "paid_online" || status === "paid_offline") return "bg-emerald-100 text-emerald-700";
  if (status === "waived") return "bg-cyan-100 text-cyan-700";
  return "bg-amber-100 text-amber-700";
}

export default function UserDetailsPage() {
  const params = useParams();
  const { t, language } = useSiteLanguage();
  const userId = typeof params?.userId === "string" ? params.userId : "";
  const currentRole = useSelector(selectCurrentUserRole);
  const { showSuccess, showError, popupNode } = useActionPopup();
  const [reviewEnrollmentRequest] = useReviewEnrollmentRequestMutation();
  const [kickingOutEnrollmentId, setKickingOutEnrollmentId] = useState("");

  const {
    data: userDetailsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserDetailsQuery(userId, {
    skip: !userId,
  });

  const payload = userDetailsData?.data;
  const user = payload?.user || null;
  const summary = payload?.summary || {};
  const enrollments = payload?.enrollmentRequests || [];
  const payments = payload?.payments || [];
  const isStudentUser = user?.role === ROLES.STUDENT;

  const relatedCourses = useMemo(() => {
    const courseMap = new Map();

    const addCourse = (batch, tag) => {
      const batchId = String(batch?._id || "");
      if (!batchId) return;

      if (!courseMap.has(batchId)) {
        courseMap.set(batchId, {
          _id: batchId,
          name: batch?.name || "Unnamed course",
          slug: batch?.slug || "",
          status: batch?.status || "unknown",
          monthlyFee: batch?.monthlyFee,
          currency: batch?.currency || "BDT",
          tags: new Set(),
        });
      }

      courseMap.get(batchId).tags.add(tag);
    };

    (user?.assignedBatches || []).forEach((batch) =>
      addCourse(batch, t("userDetails.misc.assigned", "Assigned"))
    );
    enrollments.forEach((item) =>
      addCourse(
        item?.batch,
        `${t("userDetails.misc.enrollmentPrefix", "Enrollment")}: ${t(
          `enrollmentsPage.status.${item?.status}`,
          item?.status || "unknown"
        )}`
      )
    );
    if (isStudentUser) {
      payments.forEach((item) =>
        addCourse(
          item?.batch,
          `${t("userDetails.misc.paymentPrefix", "Payment")}: ${t(
            `paymentsPage.status.${item?.status}`,
            item?.status || "unknown"
          )}`
        )
      );
    }

    return Array.from(courseMap.values()).map((item) => ({
      ...item,
      tags: Array.from(item.tags),
    }));
  }, [enrollments, isStudentUser, payments, t, user]);

  const detailErrorMessage = normalizeApiError(error, t("userDetails.messages.loadError", "Failed to load user details."));
  const canOpenUserList = currentRole === ROLES.ADMIN;

  const handleKickOut = async (enrollment) => {
    const targetCourse = enrollment?.batch?.name || t("userDetails.misc.thisCourse", "this course");
    const proceed = window.confirm(t("userDetails.messages.removeConfirm", `Remove this student from ${targetCourse}?`, { course: targetCourse }));
    if (!proceed) return;

    const inputReason = window.prompt(t("userDetails.messages.kickoutReasonPrompt", "Kick-out reason"), t("userDetails.messages.defaultKickoutReason", "Removed from course by staff"));
    if (inputReason === null) return;

    const reason = String(inputReason || "").trim() || t("userDetails.messages.defaultKickoutReason", "Removed from course by staff");

    try {
      setKickingOutEnrollmentId(enrollment._id);
      await reviewEnrollmentRequest({
        enrollmentId: enrollment._id,
        status: "rejected",
        rejectionReason: reason,
      }).unwrap();
      showSuccess(t("userDetails.messages.kickoutSuccess", "Student removed from the selected course."));
      refetch();
    } catch (kickoutError) {
      const resolvedError = normalizeApiError(kickoutError, t("userDetails.messages.kickoutFailed", "Failed to remove student from course."));
      showError(resolvedError);
    } finally {
      setKickingOutEnrollmentId("");
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR]}>
      <section className="container-page py-8 md:py-10">
        <RevealSection noStagger className="site-panel rounded-[clamp(8px,5%,12px)] p-5 md:p-6">
          <RevealItem className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="site-kicker">{t("userDetails.layout.kicker", "User Details")}</p>
              <h1 className="site-title mt-4">{t("userDetails.layout.title", "Directory Profile")}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => refetch()} className="site-button-secondary">
                {t("userDetails.actions.refresh", "Refresh")}
              </button>
              <Link href={`/users/${userId}`} className="site-button-secondary">
                {t("userDetails.actions.publicProfile", "Public Profile")}
              </Link>
              <Link href={canOpenUserList ? "/users" : "/dashboard"} className="site-button-primary">
                {canOpenUserList
                  ? t("userDetails.actions.backToUsers", "Back to Users")
                  : t("userDetails.actions.backToDashboard", "Back to Dashboard")}
              </Link>
            </div>
          </RevealItem>

          {isLoading ? (
            <div className="mt-6">
              <ListSkeleton rows={6} />
            </div>
          ) : isError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">{detailErrorMessage}</p>
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {t("userDetails.messages.userNotFound", "User not found.")}
            </div>
          ) : (
            <>
              <RevealItem className="mt-6 flex flex-wrap items-start gap-4">
                <Avatar
                  src={user.profilePhoto?.url}
                  name={user.fullName || t("userDetails.messages.unnamedUser", "Unnamed User")}
                  className="h-16 w-16 rounded-xl"
                  fallbackClassName="bg-slate-900 text-base font-extrabold text-white"
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-950 md:text-xl">{user.fullName || t("userDetails.messages.unnamedUser", "Unnamed User")}</h2>
                  <p className="mt-1 break-all text-sm text-slate-600">{user.email || t("userDetails.messages.noEmail", "No email")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user.role} />
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                        user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {user.isActive
                        ? t("userDetails.misc.active", "Active")
                        : t("userDetails.misc.inactive", "Inactive")}
                    </span>
                  </div>
                </div>
              </RevealItem>

              <RevealSection className={`mt-6 grid gap-3 sm:grid-cols-2 ${isStudentUser ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}>
                <RevealItem as="article" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.relatedCourses", "Related Courses")}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-950">
                    {summary?.courses?.totalRelatedCourses || relatedCourses.length}
                  </p>
                </RevealItem>
                <RevealItem as="article" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.enrollments", "Enrollments")}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-950">{summary?.enrollment?.total || enrollments.length}</p>
                </RevealItem>
                {isStudentUser ? (
                  <>
                    <RevealItem as="article" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.totalDue", "Total Due")}</p>
                      <p className="mt-2 text-xl font-extrabold text-slate-950">
                        {formatAmount(summary?.payments?.totalDue || 0, language)}
                      </p>
                    </RevealItem>
                    <RevealItem as="article" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.totalPaid", "Total Paid")}</p>
                      <p className="mt-2 text-xl font-extrabold text-slate-950">
                        {formatAmount(summary?.payments?.totalPaid || 0, language)}
                      </p>
                    </RevealItem>
                  </>
                ) : null}
              </RevealSection>

              <RevealSection className="mt-5 grid gap-5 lg:grid-cols-2">
                <RevealItem as="section" className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.personalDetails", "Personal Details")}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.name", "Name")}</dt>
                      <dd className="font-semibold text-slate-900">{user.fullName || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.email", "Email")}</dt>
                      <dd className="break-all text-slate-900">{user.email || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.phone", "Phone")}</dt>
                      <dd className="text-slate-900">{user.phone || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.school", "School")}</dt>
                      <dd className="text-slate-900">{user.school || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.college", "College")}</dt>
                      <dd className="text-slate-900">{user.college || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.facebook", "Facebook")}</dt>
                      <dd className="break-all text-slate-900">{user.facebookProfileId || t("userDetails.misc.na", "N/A")}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.created", "Created")}</dt>
                      <dd className="text-slate-900">{formatDateTime(user.createdAt, t, language)}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="font-semibold text-slate-500">{t("userDetails.layout.lastLogin", "Last Login")}</dt>
                      <dd className="text-slate-900">{formatDateTime(user.lastLoginAt, t, language)}</dd>
                    </div>
                  </dl>
                </RevealItem>

                <RevealItem as="section" className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.courseLinks", "Course Links")}</h3>
                  {relatedCourses.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">{t("userDetails.misc.noRelatedCourses", "No related courses for this user.")}</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {relatedCourses.map((course) => (
                        <article key={course._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{course.name}</p>
                              <p className="text-xs text-slate-600">
                                {course.slug || t("userDetails.misc.noSlug", "no-slug")} | {formatAmount(course.monthlyFee || 0, language, course.currency)}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
                              {t(`courseCard.status.${course.status}`, course.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {course.tags.map((tag) => (
                              <span
                                key={`${course._id}-${tag}`}
                                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </RevealItem>
              </RevealSection>

              <RevealSection className={`mt-5 grid gap-5 ${isStudentUser ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
                <RevealItem as="section" className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.enrollmentHistory", "Enrollment History")}</h3>
                  {enrollments.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">{t("userDetails.misc.noEnrollments", "No enrollment history.")}</p>
                  ) : (
                    <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {enrollments.map((item) => (
                        <article key={item._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{item.batch?.name || t("userDetails.misc.unknownCourse", "Unknown course")}</p>
                              <p className="mt-1 text-xs text-slate-600">{t("userDetails.misc.applied", "Applied")}: {formatDateTime(item.createdAt, t, language)}</p>
                              <p className="mt-0.5 text-xs text-slate-600">{t("userDetails.misc.reviewed", "Reviewed")}: {formatDateTime(item.reviewedAt, t, language)}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${enrollmentStatusClass(item.status)}`}
                              >
                                {t(`enrollmentsPage.status.${item.status}`, item.status)}
                              </span>
                              {isStudentUser && item.status === "approved" ? (
                                <button
                                  type="button"
                                  onClick={() => handleKickOut(item)}
                                  disabled={kickingOutEnrollmentId === item._id}
                                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                >
                                  {kickingOutEnrollmentId === item._id ? t("userDetails.actions.processing", "Processing...") : t("userDetails.actions.kickOut", "Kick Out")}
                                </button>
                              ) : null}
                            </div>
                          </div>
                          {item.rejectionReason ? (
                            <p className="mt-2 text-xs text-rose-700">{t("userDetails.misc.reason", "Reason")}: {item.rejectionReason}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </RevealItem>

                {isStudentUser ? (
                  <RevealItem as="section" className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("userDetails.layout.paymentHistory", "Payment History")}</h3>
                    {payments.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-600">{t("userDetails.misc.noPayments", "No payment records.")}</p>
                    ) : (
                      <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {payments.map((item) => (
                          <article key={item._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-extrabold text-slate-900">{item.batch?.name || t("userDetails.misc.unknownCourse", "Unknown course")}</p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {t("userDetails.misc.cycle", "Cycle")}: {item.billingMonth}/{item.billingYear} | {t("userDetails.misc.covers", "Covers")}: {
                                    new Date(Date.UTC(item.billingYear, item.billingMonth - 2, 1)).toLocaleDateString(
                                      language === "bn" ? "bn-BD" : "en-US", 
                                      { month: "short", year: "numeric" }
                                    )
                                  } | {formatAmount(item.amount, language, item.currency)}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">
                                  {t("userDetails.misc.due", "Due")}: {formatDateTime(item.dueDate, t, language)} | {t("userDetails.misc.paid", "Paid")}: {formatDateTime(item.paidAt, t, language)}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${paymentStatusClass(item.status)}`}
                              >
                                {t(`paymentsPage.status.${item.status}`, item.status)}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </RevealItem>
                ) : null}
              </RevealSection>
            </>
          )}
        </RevealSection>
      </section>
      {popupNode}
    </RequireAuth>
  );
}
