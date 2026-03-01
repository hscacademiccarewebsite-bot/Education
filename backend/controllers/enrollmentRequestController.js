const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const { canAccessBatch, getAccessibleBatchIdsForStaff, isAdmin, isValidObjectId } = require("../utils/batchAccess");

class EnrollmentRequestController {
  static async createEnrollmentRequest(req, res) {
    try {
      const { batchId, applicantName, applicantFacebookId, applicantPhoto, applicantPhone, note } = req.body;

      if (!batchId || !isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Valid batchId is required.",
        });
      }

      const batch = await Batch.findById(batchId).select("_id monthlyFee currency paymentDueDay status");
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

      const enrollmentRequest = await EnrollmentRequest.create({
        student: req.user._id,
        batch: batchId,
        applicantName: applicantName || req.user.fullName,
        applicantFacebookId: applicantFacebookId || req.user.facebookProfileId,
        applicantPhoto: applicantPhoto || req.user.profilePhoto,
        applicantPhone: applicantPhone || req.user.phone,
        note,
      });

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
        .populate("batch", "name slug monthlyFee currency status")
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
        .populate("student", "fullName email phone profilePhoto facebookProfileId role")
        .populate("batch", "name slug monthlyFee currency status")
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
        "monthlyFee currency paymentDueDay"
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

      enrollment.status = status;
      enrollment.reviewedBy = req.user._id;
      enrollment.reviewedAt = new Date();

      if (status === "approved") {
        enrollment.approvedAt = new Date();
        enrollment.rejectedAt = undefined;
        enrollment.rejectionReason = undefined;

        // On approval, ensure current month due record exists.
        const now = new Date();
        const dueDate = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), enrollment.batch.paymentDueDay || 1)
        );

        await PaymentRecord.findOneAndUpdate(
          {
            student: enrollment.student,
            batch: enrollment.batch._id,
            billingYear: now.getUTCFullYear(),
            billingMonth: now.getUTCMonth() + 1,
          },
          {
            $setOnInsert: {
              enrollmentRequest: enrollment._id,
              amount: enrollment.batch.monthlyFee,
              currency: enrollment.batch.currency || "BDT",
              dueDate,
              status: "due",
              isAutoGenerated: true,
            },
          },
          { upsert: true, new: true }
        );
      } else {
        enrollment.rejectedAt = new Date();
        enrollment.rejectionReason = rejectionReason || "Not provided";
      }

      await enrollment.save();

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
}

module.exports = EnrollmentRequestController;
