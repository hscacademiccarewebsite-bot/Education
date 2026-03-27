"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized, selectToken } from "@/lib/features/auth/authSlice";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
import {
  useCreateEnrollmentRequestMutation,
  useGetEnrollmentRequestsForReviewQuery,
  useGetMyEnrollmentRequestsQuery,
  useReviewEnrollmentRequestMutation,
} from "@/lib/features/enrollment/enrollmentApi";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { selectCurrentUser, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isStudent } from "@/lib/utils/roleUtils";
import {
  cleanupUploadedImageAsset,
  isLocalImageAsset,
  resolveImageAssetForSubmit,
  revokeImageAssetPreview,
} from "@/lib/utils/cloudinaryUpload";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

const REVIEW_FILTERS = ["pending", "approved", "rejected", "kicked_out"];

const STATUS_META = {
  pending: {
    key: "enrollmentsPage.status.pending",
    defaultLabel: "Pending",
    pillClass: "bg-amber-100 text-amber-700",
    helperKey: "enrollmentsPage.status.helperPending",
    defaultHelper: "Waiting for review",
  },
  approved: {
    key: "enrollmentsPage.status.approved",
    defaultLabel: "Approved",
    pillClass: "bg-emerald-100 text-emerald-700",
    helperKey: "enrollmentsPage.status.helperApproved",
    defaultHelper: "Access granted",
  },
  rejected: {
    key: "enrollmentsPage.status.rejected",
    defaultLabel: "Rejected",
    pillClass: "bg-rose-100 text-rose-700",
    helperKey: "enrollmentsPage.status.helperRejected",
    defaultHelper: "You can apply again",
  },
  kicked_out: {
    key: "enrollmentsPage.status.kicked_out",
    defaultLabel: "Removed",
    pillClass: "bg-slate-200 text-slate-700",
    helperKey: "enrollmentsPage.status.helperKickedOut",
    defaultHelper: "Access removed by staff",
  },
  default: {
    key: "enrollmentsPage.status.notApplied",
    defaultLabel: "Not Applied",
    pillClass: "bg-slate-100 text-slate-700",
    helperKey: "enrollmentsPage.status.helperNotApplied",
    defaultHelper: "No request submitted",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
});

function getStatusMeta(status, t) {
  const meta = STATUS_META[String(status || "").toLowerCase()] || STATUS_META.default;
  return {
    label: t ? t(meta.key, meta.defaultLabel) : meta.defaultLabel,
    pillClass: meta.pillClass,
    helper: t ? t(meta.helperKey, meta.defaultHelper) : meta.defaultHelper,
  };
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return dateFormatter.format(parsed);
}

function formatMoney(value, currency = "BDT") {
  const amount = Number(value || 0);
  return `${new Intl.NumberFormat("en-US").format(amount)} ${currency}`;
}

function resolveFacebookProfileUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return value;
  }

  const cleanValue = value.replace(/^@/, "");
  return `https://facebook.com/${cleanValue}`;
}

export default function EnrollmentsPage() {
  const { t } = useSiteLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBatchId = searchParams.get("batchId") || "";

  const role = useSelector(selectCurrentUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const isStudentRole = isStudent(role);
  const canReview = role === "admin" || role === "moderator";

  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { showSuccess, showError, requestPrompt, popupNode } = useActionPopup();

  const [form, setForm] = useState({
    batchId: "",
    applicantName: "",
    applicantFacebookId: "",
    applicantPhone: "",
    note: "",
    applicantPhoto: null,
    facebookGroupJoinRequested: false,
  });
  const [uploadingApplicantPhoto, setUploadingApplicantPhoto] = useState(false);

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const enrollmentSkip = !isInitialized || !isAuthenticated;

  const { data: myData, isLoading: myDataLoading } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: enrollmentSkip || !isStudentRole,
  });
  const { data: coursesData, isLoading: coursesLoading } = useListBatchesQuery(undefined, {
    skip: enrollmentSkip || !isStudentRole,
  });
  const { data: reviewData, isLoading: reviewLoading } = useGetEnrollmentRequestsForReviewQuery(
    { status: statusFilter },
    { skip: enrollmentSkip || !canReview }
  );

  const [createEnrollmentRequest, { isLoading: applying }] = useCreateEnrollmentRequestMutation();
  const [reviewEnrollmentRequest, { isLoading: reviewing }] = useReviewEnrollmentRequestMutation();

  const availableBatches = useMemo(
    () =>
      (coursesData?.data || []).filter(
        (batch) => batch?.status === "active" || batch?.status === "upcoming"
      ),
    [coursesData]
  );

  const myEnrollments = myData?.data || [];
  const approvedEnrollments = useMemo(
    () => myEnrollments.filter((item) => String(item.status || "").toLowerCase() === "approved"),
    [myEnrollments]
  );
  const approvedCourseEntries = useMemo(() => {
    const uniqueCourses = new Map();
    approvedEnrollments.forEach((item) => {
      const batch = item?.batch;
      const batchId = String(batch?._id || "");
      if (!batchId || uniqueCourses.has(batchId)) {
        return;
      }
      uniqueCourses.set(batchId, { batch, enrollment: item });
    });
    return Array.from(uniqueCourses.values());
  }, [approvedEnrollments]);
  const showApprovedCoursesOnlyView = isStudentRole && !preselectedBatchId;
  const enrollmentByBatchId = useMemo(() => {
    const map = new Map();
    myEnrollments.forEach((item) => {
      map.set(String(item.batch?._id || item.batch), item);
    });
    return map;
  }, [myEnrollments]);

  const selectedBatchEnrollment = enrollmentByBatchId.get(String(form.batchId || ""));
  const selectedEnrollmentStatus = String(selectedBatchEnrollment?.status || "");
  const pendingEnrollment = selectedEnrollmentStatus === "pending";
  const approvedEnrollment = selectedEnrollmentStatus === "approved";
  const kickedOutEnrollment = selectedEnrollmentStatus === "kicked_out";
  const selectedBatch = availableBatches.find((batch) => String(batch._id) === String(form.batchId));
  const hasSelectedBatchGroupLink = Boolean(selectedBatch?.facebookGroupUrl);
  const reviewItems = reviewData?.data || [];
  const selectedBatchStatusMeta = getStatusMeta(selectedBatchEnrollment?.status, t);
  const noBatchConfigured = !coursesLoading && availableBatches.length === 0;
  const applicationChecklist = [
    { label: t("enrollmentsPage.form.batchReady", "Batch ready"), done: Boolean(form.batchId) },
    {
      label: t("enrollmentsPage.form.profileDetails", "Profile details"),
      done: Boolean(
        form.applicantName.trim() && form.applicantFacebookId.trim() && form.applicantPhoto?.url
      ),
    },
    {
      label: t("enrollmentsPage.form.groupConfirmed", "Group request confirmed"),
      done: Boolean(form.facebookGroupJoinRequested && hasSelectedBatchGroupLink),
    },
  ];
  const pageTitle = isStudentRole
    ? showApprovedCoursesOnlyView
      ? t("enrollmentsPage.layout.titleStudent", "My Enrollments")
      : t("enrollmentsPage.actions.applyForBatchBtn", "Apply for Batch")
    : (
        <>
          <span className="text-emerald-600">Enrollment</span> Desk
        </>
      );
  const pageDescription = isStudentRole
    ? showApprovedCoursesOnlyView
      ? t("enrollmentsPage.layout.descStudentOnlyApproved", "Only approved courses are shown here. Open course details to continue your study flow.")
      : t("enrollmentsPage.layout.descStudentSubmit", "Submit your enrollment request once and track approval in one clean workflow.")
    : t("enrollmentsPage.layout.descAdmin", "Review incoming enrollment requests and approve or reject with clear status control.");

  useEffect(() => {
    if (!isStudentRole || !currentUser) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      applicantName: prev.applicantName || currentUser.fullName || "",
      applicantFacebookId: prev.applicantFacebookId || currentUser.facebookProfileId || "",
      applicantPhone: prev.applicantPhone || currentUser.phone || "",
      applicantPhoto:
        prev.applicantPhoto ||
        (currentUser.profilePhoto?.url
          ? {
              url: currentUser.profilePhoto.url,
              publicId: currentUser.profilePhoto.publicId || "",
            }
          : null),
    }));
  }, [currentUser, isStudentRole]);

  useEffect(() => {
    if (!isStudentRole) {
      return;
    }

    if (preselectedBatchId) {
      setForm((prev) => ({ ...prev, batchId: preselectedBatchId }));
      return;
    }

    if (!form.batchId && availableBatches.length > 0) {
      setForm((prev) => ({ ...prev, batchId: String(availableBatches[0]._id) }));
    }
  }, [availableBatches, form.batchId, isStudentRole, preselectedBatchId]);

  useEffect(
    () => () => {
      revokeImageAssetPreview(form.applicantPhoto);
    },
    [form.applicantPhoto]
  );

  const handleApply = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setUploadingApplicantPhoto(true);

    if (!form.batchId) {
      const validationMessage = t("enrollmentsPage.messages.noBatch", "No batch is available for application right now.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (!form.applicantName.trim()) {
      const validationMessage = t("enrollmentsPage.messages.nameReq", "Applicant name is required.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (!form.applicantFacebookId.trim()) {
      const validationMessage = t("enrollmentsPage.messages.fbReq", "Facebook ID is required.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (!form.applicantPhoto?.url) {
      const validationMessage = t("enrollmentsPage.messages.photoReq", "Applicant photo is required.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (pendingEnrollment) {
      const validationMessage = t("enrollmentsPage.messages.alreadyPending", "Your application is already pending for this batch.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (approvedEnrollment) {
      const validationMessage = t("enrollmentsPage.messages.alreadyApproved", "You are already approved in this batch.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (!form.facebookGroupJoinRequested) {
      const validationMessage = t("enrollmentsPage.messages.joinGroupReq", "Please send join request to private Facebook group and confirm checkbox.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }
    if (!hasSelectedBatchGroupLink) {
      const validationMessage = t("enrollmentsPage.messages.noGroupLink2", "This batch does not have a private Facebook group link configured yet.");
      setError(validationMessage);
      showError(validationMessage);
      setUploadingApplicantPhoto(false);
      return;
    }

    const hadLocalApplicantPhoto = isLocalImageAsset(form.applicantPhoto);
    let uploadedApplicantPhoto = null;

    try {
      uploadedApplicantPhoto = await resolveImageAssetForSubmit(
        form.applicantPhoto,
        "hsc-academic/enrollments",
        { token }
      );

      await createEnrollmentRequest({
        batchId: form.batchId,
        applicantName: form.applicantName.trim(),
        applicantFacebookId: form.applicantFacebookId.trim(),
        applicantPhone: form.applicantPhone.trim(),
        applicantPhoto: {
          url: uploadedApplicantPhoto?.url || form.applicantPhoto.url,
          publicId: uploadedApplicantPhoto?.publicId || form.applicantPhoto.publicId || "",
        },
        note: form.note.trim(),
        facebookGroupJoinRequested: true,
      }).unwrap();

      if (hadLocalApplicantPhoto) {
        revokeImageAssetPreview(form.applicantPhoto);
      }
      await showSuccess(
        "You already applied for this batch. Your request is pending review.\nEnrollment request submitted successfully.",
        "Application Successful"
      );
      router.push(`/courses/${form.batchId}`);
    } catch (applyError) {
      if (hadLocalApplicantPhoto && uploadedApplicantPhoto?.publicId) {
        await cleanupUploadedImageAsset(uploadedApplicantPhoto, { token });
      }
      const resolvedError = normalizeApiError(applyError);
      showError(resolvedError);
    } finally {
      setUploadingApplicantPhoto(false);
    }
  };

  const handleReview = async (enrollmentId, nextStatus) => {
    setError("");
    setMessage("");

    try {
      let rejectionReason;
      if (nextStatus === "rejected") {
        rejectionReason = await requestPrompt({
          title: t("enrollmentsPage.actions.reject", "Reject"),
          text: t("enrollmentsPage.messages.rejectReason", "Rejection reason (optional):"),
          input: "textarea",
          placeholder: t("enrollmentsPage.messages.rejectReason", "Rejection reason (optional):"),
          confirmText: t("enrollmentsPage.actions.reject", "Reject"),
        });

        if (rejectionReason === undefined) {
          return;
        }
      }

      await reviewEnrollmentRequest({
        enrollmentId,
        status: nextStatus,
        rejectionReason:
          nextStatus === "rejected"
            ? String(rejectionReason || "").trim() || t("enrollmentsPage.messages.notProvided", "Not provided")
            : undefined,
      }).unwrap();
      setMessage(t("enrollmentsPage.messages.requestStatus", `Request ${nextStatus}.`, { status: nextStatus }));
      showSuccess(t("enrollmentsPage.messages.requestStatus", `Request ${nextStatus}.`, { status: nextStatus }));
    } catch (reviewError) {
      const resolvedError = normalizeApiError(reviewError);
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <RequireAuth>
      <section className="container-page py-8 md:py-10">
        <RevealSection noStagger>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="site-kicker">{t("enrollmentsPage.layout.kicker", "Enrollment Desk")}</span>
            <h1 className="site-title mt-3">{pageTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              {pageDescription}
            </p>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>
        </RevealSection>

        {isStudentRole ? (
          showApprovedCoursesOnlyView ? (
            <section className="rounded-[clamp(10px,5%,14px)] border border-slate-200 bg-white/95 p-5 shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 md:text-lg">Approved Courses</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Only courses with approved enrollment are shown.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
                  {t("enrollmentsPage.layout.numApproved", "{count} approved", { count: approvedCourseEntries.length })}
                </span>
              </div>

              {myDataLoading ? (
                <div className="mt-5">
                  <ListSkeleton rows={3} />
                </div>
              ) : approvedCourseEntries.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
                  <p className="text-base font-extrabold text-slate-900">No approved course yet</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Browse courses and apply to get your first approval.
                  </p>
                  <Link href="/courses" className="site-button-primary mt-4 inline-flex px-4 py-2 text-[10px]">
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <RevealSection className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {approvedCourseEntries.map(({ batch: course, enrollment }, index) => (
                    <RevealItem
                      key={course?._id || index}
                      className="overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                    >
                      <div className="relative h-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {course?.banner?.url || course?.thumbnail?.url ? (
                          <img
                            src={course?.banner?.url || course?.thumbnail?.url}
                            alt={course?.name || t("enrollmentsPage.layout.courseFallback", "Course")}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                            Course Banner
                          </div>
                        )}
                        <span className="absolute right-2.5 top-2.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                          Approved
                        </span>
                      </div>

                      <div className="mt-3">
                        <h3 className="line-clamp-1 text-sm font-extrabold text-slate-900">{course?.name || t("enrollmentsPage.layout.courseFallback", "Course")}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                          {course?.description || t("enrollmentsPage.layout.approvedForCourse", "Approved for this course.")}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <p className="text-[11px] font-extrabold text-slate-900">
                          {formatMoney(course?.monthlyFee, course?.currency || "BDT")}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(enrollment?.updatedAt || enrollment?.createdAt) || "Approved"}
                        </span>
                      </div>

                      <Link
                        href={`/courses/${course?._id}`}
                        className="site-button-primary mt-3 h-9 w-full justify-center px-3 text-[10px]"
                      >
                        Open Course
                      </Link>
                    </RevealItem>
                  ))}
                </RevealSection>
              )}
            </section>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <form
                onSubmit={handleApply}
                className="overflow-hidden rounded-[clamp(10px,5%,14px)] border border-slate-200 bg-white/95 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="border-b border-slate-200 px-5 py-4 md:px-6 md:py-5">
                  <h2 className="text-lg font-extrabold text-slate-900 md:text-xl">Application Form</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Fill out the form below. Your request will be reviewed by the academic team.
                  </p>
                </div>

                <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-3">
                    {applicationChecklist.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-xl border px-3 py-2 ${
                          item.done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em]">{item.label}</p>
                        <p className="mt-1 text-xs font-semibold">{item.done ? t("enrollmentsPage.form.done", "Done") : "Pending"}</p>
                      </div>
                    ))}
                  </div>

                  {noBatchConfigured ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      No active or upcoming batches are available right now.
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        Applying To
                      </p>
                      <p className="mt-1 text-base font-extrabold text-slate-900">
                        {selectedBatch?.name || t("enrollmentsPage.messages.noBatchAvail", "No batch available")}
                      </p>
                      {selectedBatchEnrollment ? (
                        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                          {t("enrollmentsPage.form.existingRequest", "Existing request:")}
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${selectedBatchStatusMeta.pillClass}`}
                          >
                            {selectedBatchStatusMeta.label}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    {selectedBatch?.facebookGroupUrl ? (
                      <div className="md:col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-900">
                        <p className="font-semibold">
                          Step 1. Send a join request to the private Facebook group.
                        </p>
                        <a
                          href={selectedBatch.facebookGroupUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700 underline"
                        >
                          Open Private Facebook Group
                        </a>
                      </div>
                    ) : form.batchId ? (
                      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        This batch does not have a private Facebook group link configured yet.
                      </div>
                    ) : null}

                    <FloatingInput
                      id="applicant-name"
                      label={t("enrollmentsPage.form.applicantName", "Applicant Name")}
                      required
                      value={form.applicantName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, applicantName: event.target.value }))
                      }
                      autoComplete="name"
                    />

                    <FloatingInput
                      id="facebook-id"
                      label={t("enrollmentsPage.form.facebookId", "Facebook ID")}
                      required
                      value={form.applicantFacebookId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, applicantFacebookId: event.target.value }))
                      }
                    />

                    <FloatingInput
                      id="phone"
                      label={t("enrollmentsPage.form.phone", "Phone (Optional)")}
                      value={form.applicantPhone}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
                      }
                      autoComplete="tel"
                    />

                    <div className="md:col-span-2">
                      <FloatingTextarea
                        id="note"
                        label={t("enrollmentsPage.form.note", "Note (Optional)")}
                        value={form.note}
                        onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <ImageUploadField
                        label={t("enrollmentsPage.form.applicantPhoto", "Applicant Photo")}
                        folder="hsc-academic/enrollments"
                        mode="local"
                        asset={form.applicantPhoto}
                        previewAlt={t("enrollmentsPage.form.photoAlt", "Applicant photo")}
                        className="bg-white"
                        previewClassName="mt-3 h-24 w-24 rounded-xl border border-slate-200 object-cover"
                        onChange={(asset) =>
                          setForm((prev) => ({
                            ...prev,
                            applicantPhoto: asset?.url ? asset : null,
                          }))
                        }
                      />
                    </div>

                    <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.facebookGroupJoinRequested}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            facebookGroupJoinRequested: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-400 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="font-semibold">
                        I have already sent a join request in the private Facebook group.
                      </span>
                    </label>

                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <p className="text-xs text-slate-500">
                        Required: applicant name, Facebook ID, photo, and group confirmation.
                      </p>
                      <button
                        type="submit"
                        disabled={
                          applying ||
                          uploadingApplicantPhoto ||
                          pendingEnrollment ||
                          approvedEnrollment ||
                          kickedOutEnrollment ||
                          !form.facebookGroupJoinRequested ||
                          !hasSelectedBatchGroupLink
                        }
                        className="site-button-primary min-w-[190px] px-5 py-2.5 text-[10px] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        {applying || uploadingApplicantPhoto
                          ? t("enrollmentsPage.actions.submitting", "Submitting...")
                          : pendingEnrollment
                          ? t("enrollmentsPage.actions.alreadyApplied", "Already Applied (Pending)")
                          : approvedEnrollment
                          ? t("enrollmentsPage.actions.alreadyApproved", "Already Approved")
                          : kickedOutEnrollment
                          ? t("enrollmentsPage.actions.removedByStaff", "Removed by Staff")
                          : selectedBatchEnrollment?.status === "rejected"
                          ? t("enrollmentsPage.actions.reApply", "Re-Apply for Batch")
                          : t("enrollmentsPage.actions.applyForBatchBtn", "Apply for Batch")}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <aside className="space-y-4">
                <section className="rounded-[clamp(10px,5%,14px)] border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-5 shadow-[0_10px_22px_rgba(15,23,42,0.07)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Selected Batch
                  </p>
                  {selectedBatch ? (
                    <>
                      <h3 className="mt-3 text-lg font-extrabold text-slate-900">{selectedBatch.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedBatch.description || t("enrollmentsPage.layout.noDesc", "No description available.")}
                      </p>
                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="font-semibold text-slate-500">{t("enrollmentsPage.layout.status", "Status")}</dt>
                          <dd className="font-extrabold capitalize text-slate-800">
                            {String(selectedBatch.status || "active")}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="font-semibold text-slate-500">{t("enrollmentsPage.layout.monthlyFee", "Monthly Fee")}</dt>
                          <dd className="font-extrabold text-slate-900">
                            {formatMoney(selectedBatch.monthlyFee, selectedBatch.currency || "BDT")}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="font-semibold text-slate-500">{t("enrollmentsPage.layout.yourStatus", "Your Status")}</dt>
                          <dd>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${selectedBatchStatusMeta.pillClass}`}
                            >
                              {selectedBatchStatusMeta.label}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">
                      Batch details will appear when an active or upcoming batch is available.
                    </p>
                  )}
                </section>

                <section className="rounded-[clamp(10px,5%,14px)] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Submission Notes
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>{t("enrollmentsPage.layout.note1", "Use your real Facebook profile to help the reviewer verify identity.")}</li>
                    <li>{t("enrollmentsPage.layout.note2", "Only one active request per batch is allowed at a time.")}</li>
                    <li>{t("enrollmentsPage.layout.note3", "If rejected, update your details and submit again.")}</li>
                  </ul>
                </section>
              </aside>
            </div>
          )
        ) : (
          <section className="overflow-hidden rounded-[clamp(10px,5%,14px)] border border-slate-200 bg-white/95 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{t("enrollmentsPage.layout.requestQueue", "Request Queue")}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Filter by status and process enrollment decisions.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
                  {t("enrollmentsPage.layout.numShown", "{count} shown", { count: reviewItems.length })}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {REVIEW_FILTERS.map((filter) => {
                  const active = statusFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 text-xs ${active ? "site-button-primary" : "site-button-secondary"}`}
                    >
                      {getStatusMeta(filter, t).label}
                    </button>
                  );
                })}
              </div>
            </div>

            {reviewLoading ? (
              <div className="px-5 py-5 md:px-6">
                <ListSkeleton rows={4} />
              </div>
            ) : reviewItems.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-600 md:px-6">
                No requests found for this filter.
              </p>
            ) : (
              <RevealSection className="divide-y divide-slate-200">
                {reviewItems.map((item) => {
                  const itemStatusMeta = getStatusMeta(item.status, t);
                  const rawFacebookProfile =
                    item.student?.facebookProfileId || item.applicantFacebookId || "";
                  const facebookProfileUrl = resolveFacebookProfileUrl(rawFacebookProfile);

                  return (
                    <RevealItem key={item._id} className="px-5 py-4 md:px-6">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar
                            src={item.applicantPhoto?.url}
                            name={item.applicantName || "User"}
                            className="h-10 w-10 rounded-lg"
                            fallbackClassName="bg-slate-900 text-[10px] font-black text-white"
                          />

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-extrabold text-slate-900">
                              {item.applicantName || item.student?.fullName || t("enrollmentsPage.layout.studentFallback", "Student")}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-600">
                              Batch: {item.batch?.name || t("enrollmentsPage.layout.batchNA", "Batch N/A")}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-600">
                              <span>{t("enrollmentsPage.layout.fbPrefix", "FB:")}</span>
                              {facebookProfileUrl ? (
                                <a
                                  href={facebookProfileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-cyan-700 underline"
                                  title={rawFacebookProfile}
                                >
                                  {rawFacebookProfile}
                                </a>
                              ) : (
                                <span>{item.applicantFacebookId || t("enrollmentsPage.layout.na", "N/A")}</span>
                              )}
                              {item.applicantPhone ? (
                                <>
                                  <span>|</span>
                                  <span>{item.applicantPhone}</span>
                                </>
                              ) : null}
                              <span>|</span>
                              <span>
                                Group request: {item.facebookGroupJoinRequested ? t("enrollmentsPage.layout.sent", "Sent") : t("enrollmentsPage.layout.notConfirmed", "Not confirmed")}
                              </span>
                            </div>

                            {item.batch?.facebookGroupUrl ? (
                              <a
                                href={item.batch.facebookGroupUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex text-xs font-semibold text-cyan-700 underline"
                              >
                                Open private Facebook group
                              </a>
                            ) : (
                              <p className="mt-1 text-xs font-semibold text-amber-700">
                                Group link not configured
                              </p>
                            )}

                            {item.note ? (
                              <p className="mt-1 text-xs text-slate-500">{t("enrollmentsPage.layout.notePrefix", "Note:")} {item.note}</p>
                            ) : null}

                            {item.status === "rejected" || item.status === "kicked_out" ? (
                              <p className="mt-1 text-xs font-semibold text-rose-700">
                                Reason: {(item.status === "kicked_out" ? item.kickoutReason : item.rejectionReason) || t("enrollmentsPage.messages.notProvided", "Not provided")}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-col lg:items-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${itemStatusMeta.pillClass}`}
                          >
                            {itemStatusMeta.label}
                          </span>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {formatDate(item.createdAt)}
                          </p>

                          {item.status === "pending" && canReview ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={reviewing}
                                onClick={() => handleReview(item._id, "approved")}
                                className="site-button-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={reviewing}
                                onClick={() => handleReview(item._id, "rejected")}
                                className="site-button-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </RevealItem>
                  );
                })}
              </RevealSection>
            )}
          </section>
        )}
      </section>

      {popupNode}
    </RequireAuth>
  );
}
