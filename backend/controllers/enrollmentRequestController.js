const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const Notification = require("../model/notificationSchema");
const User = require("../model/userSchema");
const { canAccessBatch, getAccessibleBatchIdsForStaff, isAdmin, isValidObjectId } = require("../utils/batchAccess");
const { normalizeCloudinaryAsset } = require("../utils/cloudinaryAsset");
const {
  buildAcademicBatchLabel,
  enrichNestedUserField,
  normalizeAcademicBatchYear,
} = require("../utils/academicProfile");

const parseBoolean = (value, fallbackValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallbackValue;
};

async function createAdminEnrollmentNotification({ student, batch, isResubmission = false }) {
  const studentName = String(
    student?.fullName || student?.applicantName || student?.name || "A student"
  ).trim();
  const batchName = String(batch?.name || "a batch").trim();

  await Notification.create({
    isGlobalAdmin: true,
    title: isResubmission ? "Enrollment Request Re-submitted" : "New Enrollment Request",
    message: isResubmission
      ? `${studentName} re-submitted an enrollment request for "${batchName}".`
      : `${studentName} submitted a new enrollment request for "${batchName}".`,
    type: "system",
    link: `/enrollments?batchId=${batch?._id || ""}`,
    metadata: {
      batchId: batch?._id,
      studentId: student?._id,
      event: isResubmission ? "enrollment_resubmitted" : "enrollment_created",
    },
  });
}

class EnrollmentRequestController {
  static async createEnrollmentRequest(req, res) {
    try {
      const {
        batchId,
        applicantName,
        applicantFacebookId,
        applicantPhoto,
        applicantPhone,
        academicBatchYear,
        note,
        facebookGroupJoinRequested,
      } = req.body;

      if (!batchId || !isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Valid batchId is required.",
        });
      }

      const batch = await Batch.findById(batchId).select("_id name monthlyFee currency paymentDueDay status moderators");
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      if (batch.status === "archived") {
        return res.status(400).json({
          success: false,
          message: "Archived batch does not accept enrollment.",
        });
      }

      const resolvedApplicantName = String(applicantName || req.user.fullName || "").trim();
      const resolvedFacebookId = String(
        applicantFacebookId || req.user.facebookProfileId || ""
      ).trim();
      const resolvedPhone = String(applicantPhone || req.user.phone || "").trim();
      const resolvedPhoto = normalizeCloudinaryAsset(applicantPhoto || req.user.profilePhoto);
      const resolvedAcademicBatchYear = normalizeAcademicBatchYear(
        academicBatchYear ?? req.user.academicBatchYear
      );
      const resolvedAcademicBatchLabel = buildAcademicBatchLabel(resolvedAcademicBatchYear);
      const resolvedNote = String(note || "").trim();
      const resolvedJoinRequested = parseBoolean(facebookGroupJoinRequested, false);

      if (!resolvedApplicantName) {
        return res.status(400).json({
          success: false,
          message: "Applicant name is required.",
        });
      }

      if (!resolvedFacebookId) {
        return res.status(400).json({
          success: false,
          message: "Facebook ID is required.",
        });
      }

      if (!resolvedPhoto?.url) {
        return res.status(400).json({
          success: false,
          message: "Applicant photo is required.",
        });
      }

      if (!resolvedAcademicBatchYear || !resolvedAcademicBatchLabel) {
        return res.status(400).json({
          success: false,
          message: "Academic batch selection is required.",
        });
      }

      if (!resolvedJoinRequested) {
        return res.status(400).json({
          success: false,
          message: "You must send a join request to the private Facebook group before applying.",
        });
      }

      const existingRequest = await EnrollmentRequest.findOne({
        student: req.user._id,
        batch: batchId,
      });

      if (existingRequest) {
        if (existingRequest.status === "approved") {
          return res.status(409).json({
            success: false,
            message: "You are already approved in this batch.",
          });
        }

        if (existingRequest.status === "pending") {
          return res.status(409).json({
            success: false,
            message: "Your enrollment request is already pending review.",
          });
        }

        if (existingRequest.status === "kicked_out") {
          return res.status(409).json({
            success: false,
            message: "Your access was removed from this batch. Please contact the admin team.",
          });
        }

        // Re-submit previously rejected request with updated form snapshot.
        existingRequest.applicantName = resolvedApplicantName;
        existingRequest.applicantFacebookId = resolvedFacebookId;
        existingRequest.applicantPhoto = resolvedPhoto;
        existingRequest.applicantPhone = resolvedPhone;
        existingRequest.academicBatchYear = resolvedAcademicBatchYear;
        existingRequest.academicBatchLabel = resolvedAcademicBatchLabel;
        existingRequest.note = resolvedNote;
        existingRequest.facebookGroupJoinRequested = resolvedJoinRequested;

        existingRequest.status = "pending";
        existingRequest.reviewedBy = undefined;
        existingRequest.reviewedAt = undefined;
        existingRequest.approvedAt = undefined;
        existingRequest.rejectedAt = undefined;
        existingRequest.rejectionReason = undefined;
        existingRequest.kickedOutAt = undefined;
        existingRequest.kickoutReason = undefined;

        req.user.academicBatchYear = resolvedAcademicBatchYear;
        req.user.academicBatchLabel = resolvedAcademicBatchLabel;
        await req.user.save();

        await existingRequest.save();

        try {
          await createAdminEnrollmentNotification({
            student: req.user,
            batch,
            isResubmission: true,
          });
        } catch (notifErr) {
          console.error("Failed to create admin enrollment re-submission notification:", notifErr);
        }

        return res.status(200).json({
          success: true,
          message: "Enrollment request re-submitted successfully.",
          data: existingRequest,
        });
      }

      const enrollmentRequest = await EnrollmentRequest.create({
        student: req.user._id,
        batch: batchId,
        applicantName: resolvedApplicantName,
        applicantFacebookId: resolvedFacebookId,
        applicantPhoto: resolvedPhoto,
        applicantPhone: resolvedPhone,
        academicBatchYear: resolvedAcademicBatchYear,
        academicBatchLabel: resolvedAcademicBatchLabel,
        note: resolvedNote,
        facebookGroupJoinRequested: resolvedJoinRequested,
      });

      req.user.academicBatchYear = resolvedAcademicBatchYear;
      req.user.academicBatchLabel = resolvedAcademicBatchLabel;
      await req.user.save();

      try {
        await createAdminEnrollmentNotification({
          student: req.user,
          batch,
        });
      } catch (notifErr) {
        console.error("Failed to create admin enrollment notification:", notifErr);
      }

      // --- Email Notification Trigger (Admins & Moderators) ---
      try {
        const { sendNewEnrollmentAlertEmail } = require("../utils/email");
        const admins = await User.find({ role: "admin", email: { $exists: true, $ne: "" } }).select("fullName email");
        
        let batchMods = [];
        if (batch.moderators && batch.moderators.length > 0) {
           batchMods = await User.find({ 
             _id: { $in: batch.moderators }, 
             email: { $exists: true, $ne: "" } 
           }).select("fullName email");
        }
        
        // Merge & deduplicate
        const staffMap = new Map();
        [...admins, ...batchMods].forEach(staff => staffMap.set(staff._id.toString(), staff));
        const staffList = Array.from(staffMap.values());
        
        if (staffList.length > 0) {
           sendNewEnrollmentAlertEmail(staffList, req.user, batch).catch(err => 
               console.error("Failed sending enrollment alert email:", err)
           );
        }
      } catch (emailErr) {
        console.error("Failed to fetch staff for enrollment alert email:", emailErr);
      }

      return res.status(201).json({
        success: true,
        message: "Enrollment request submitted successfully.",
        data: enrollmentRequest,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Enrollment request already exists for this batch.",
        });
      }

      if (error?.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to submit enrollment request.",
        error: error.message,
      });
    }
  }

  static async getMyEnrollmentRequests(req, res) {
    try {
      const requests = await EnrollmentRequest.find({ student: req.user._id })
        .populate(
          "batch",
          "name slug description monthlyFee currency status facebookGroupUrl banner thumbnail startsAt endsAt"
        )
        .populate("reviewedBy", "fullName role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load your enrollment requests.",
        error: error.message,
      });
    }
  }

  static async listEnrollmentRequestsForReview(req, res) {
    try {
      const { batchId, status } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      if (batchId) {
        if (!isValidObjectId(batchId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid batchId.",
          });
        }

        const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, batchId));
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "Forbidden to review requests for this batch.",
          });
        }

        query.batch = batchId;
      } else if (!isAdmin(req.user)) {
        const accessibleBatchIds = await getAccessibleBatchIdsForStaff(req.user);
        query.batch = { $in: accessibleBatchIds };
      }

      const requests = await EnrollmentRequest.find(query)
        .populate(
          "student",
          "fullName email phone profilePhoto facebookProfileId role academicBatchYear academicBatchLabel isExStudent"
        )
        .populate(
          "batch",
          "name slug description monthlyFee currency status facebookGroupUrl banner thumbnail startsAt endsAt"
        )
        .populate("reviewedBy", "fullName role")
        .sort({ createdAt: -1 });

      const enrichedRequests = await enrichNestedUserField(requests, "student");

      return res.status(200).json({
        success: true,
        count: enrichedRequests.length,
        data: enrichedRequests,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list enrollment requests.",
        error: error.message,
      });
    }
  }

  static async reviewEnrollmentRequest(req, res) {
    try {
      const { enrollmentId } = req.params;
      const { status, rejectionReason } = req.body;

      if (!isValidObjectId(enrollmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid enrollmentId.",
        });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "status must be either approved or rejected.",
        });
      }

      const enrollment = await EnrollmentRequest.findById(enrollmentId).populate(
        "batch",
        "name monthlyFee currency paymentDueDay"
      );

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: "Enrollment request not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, enrollment.batch._id));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to review this enrollment request.",
        });
      }

      if (enrollment.status === "approved" && status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Approved enrollments must be removed using the kick-out action.",
        });
      }

      if (status === "approved") {
        const enrollmentStudent = await User.findById(enrollment.student).select("role");
        if (!enrollmentStudent || enrollmentStudent.role !== "student") {
          return res.status(400).json({
            success: false,
            message: "Only student accounts can be approved for enrollment.",
          });
        }
        // Approval unlocks course access only. Payment records are created exclusively
        // from the admin monthly due generation flow.
      } else {
        await PaymentRecord.updateMany(
          {
            student: enrollment.student,
            batch: enrollment.batch._id,
            status: "due",
          },
          {
            $set: {
              status: "waived",
              paymentMethod: "manual_adjustment",
              paidBy: req.user._id,
              note: rejectionReason || "Enrollment rejected by staff. Outstanding dues were waived.",
            },
          }
        );
        enrollment.approvedAt = undefined;

        // --- Email Notification Trigger (Student Rejection) ---
        try {
           const { sendEnrollmentRejectedEmail } = require("../utils/email");
           const studentUser = await User.findById(enrollment.student).select("fullName email");
           if (studentUser && studentUser.email) {
              sendEnrollmentRejectedEmail(studentUser, enrollment.batch, rejectionReason || "Not provided").catch(err => 
                  console.error("Failed sending enrollment rejection email:", err)
              );
           }
        } catch (emailErr) {
           console.error("Failed pulling student for enrollment rejection email:", emailErr);
        }
      }

      enrollment.status = status;
      enrollment.reviewedBy = req.user._id;
      enrollment.reviewedAt = new Date();
      enrollment.rejectedAt = status === "rejected" ? new Date() : undefined;
      enrollment.rejectionReason = status === "rejected" ? rejectionReason || "Not provided" : undefined;
      enrollment.kickedOutAt = undefined;
      enrollment.kickoutReason = undefined;
      enrollment.approvedAt = status === "approved" ? new Date() : undefined;

      await enrollment.save();

      // --- Notification Trigger ---
      if (status === "approved") {
        try {
          const Notification = require("../model/notificationSchema");
          await Notification.create({
            recipient: enrollment.student,
            title: "Enrollment Approved!",
            message: `Your enrollment for "${enrollment.batch?.name || "the course"}" has been approved. Welcome aboard!`,
            type: "system",
            link: "/payments",
          });
        } catch (notifErr) {
          console.error("Failed to create enrollment approval notification:", notifErr);
        }
        
        // --- Email Notification Trigger (Student Approval) ---
        try {
           const { sendEnrollmentApprovedEmail } = require("../utils/email");
           const studentUser = await User.findById(enrollment.student).select("fullName email");
           if (studentUser && studentUser.email) {
              sendEnrollmentApprovedEmail(studentUser, enrollment.batch).catch(err => 
                  console.error("Failed sending enrollment approval email:", err)
              );
           }
        } catch (emailErr) {
           console.error("Failed pulling student for enrollment approval email:", emailErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Enrollment request ${status}.`,
        data: enrollment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to review enrollment request.",
        error: error.message,
      });
    }
  }

  static async kickOutEnrollment(req, res) {
    try {
      const { enrollmentId } = req.params;
      const reason = String(req.body?.reason || "").trim();

      if (!isValidObjectId(enrollmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid enrollmentId.",
        });
      }

      const enrollment = await EnrollmentRequest.findById(enrollmentId).populate(
        "batch",
        "name monthlyFee currency paymentDueDay"
      );

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: "Enrollment request not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, enrollment.batch._id));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to update this enrollment request.",
        });
      }

      if (enrollment.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Only approved enrollments can be kicked out.",
        });
      }

      const resolvedReason = reason || "Removed from course by staff.";

      await PaymentRecord.updateMany(
        {
          student: enrollment.student,
          batch: enrollment.batch._id,
          status: "due",
        },
        {
          $set: {
            status: "waived",
            paymentMethod: "manual_adjustment",
            paidBy: req.user._id,
            note: resolvedReason,
          },
        }
      );

      enrollment.status = "kicked_out";
      enrollment.reviewedBy = req.user._id;
      enrollment.reviewedAt = new Date();
      enrollment.approvedAt = undefined;
      enrollment.rejectedAt = undefined;
      enrollment.rejectionReason = undefined;
      enrollment.kickedOutAt = new Date();
      enrollment.kickoutReason = resolvedReason;

      await enrollment.save();

      try {
        await Notification.create({
          recipient: enrollment.student,
          title: "Course Access Removed",
          message: `Your access to "${enrollment.batch?.name || "the course"}" has been removed by staff.`,
          type: "system",
          link: "/enrollments",
        });
      } catch (notifErr) {
        console.error("Failed to create kick-out notification:", notifErr);
      }

      return res.status(200).json({
        success: true,
        message: "Enrollment kicked out successfully.",
        data: enrollment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to kick out enrollment.",
        error: error.message,
      });
    }
  }
}

module.exports = EnrollmentRequestController;
