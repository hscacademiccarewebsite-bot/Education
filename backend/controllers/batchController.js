const Batch = require("../model/batchSchema");
const Subject = require("../model/subjectSchema");
const Chapter = require("../model/chapterSchema");
const Video = require("../model/videoSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const User = require("../model/userSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");
const {
  normalizeCloudinaryAsset,
  uploadImageFromDataUri,
  deleteCloudinaryAssetByPublicId,
} = require("../utils/cloudinaryAsset");

class BatchController {
  static async createBatch(req, res) {
    try {
      const {
        name,
        slug,
        description,
        facebookGroupUrl,
        monthlyFee,
        currency,
        paymentDueDay,
        autoGenerateMonthlyDues,
        status,
        startsAt,
        endsAt,
        banner,
        thumbnail,
        bannerDataUri,
        bannerBase64,
      } = req.body;

      if (!name || !slug || !facebookGroupUrl || monthlyFee === undefined) {
        return res.status(400).json({
          success: false,
          message: "name, slug, facebookGroupUrl and monthlyFee are required.",
        });
      }

      const bannerPayload = bannerDataUri || bannerBase64;
      let resolvedBanner = normalizeCloudinaryAsset(banner ?? thumbnail);
      if (bannerPayload) {
        resolvedBanner = await uploadImageFromDataUri(bannerPayload);
      }

      const batch = await Batch.create({
        name,
        slug,
        description,
        facebookGroupUrl,
        monthlyFee,
        currency,
        paymentDueDay,
        autoGenerateMonthlyDues,
        status,
        startsAt,
        endsAt,
        banner: resolvedBanner,
        thumbnail: resolvedBanner,
        createdBy: req.user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Course created successfully.",
        data: batch,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Course name or slug already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create course.",
        error: error.message,
      });
    }
  }

  static async listBatches(req, res) {
    try {
      const { status } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      // Public visitors and students see only non-archived batches by default.
      if ((!req.user || req.user?.role === "student") && !status) {
        query.status = { $in: ["upcoming", "active"] };
      }

      const batches = await Batch.find(query)
        .populate("teachers", "fullName email role")
        .populate("moderators", "fullName email role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: batches.length,
        data: batches,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list courses.",
        error: error.message,
      });
    }
  }

  static async getBatchById(req, res) {
    try {
      const { batchId } = req.params;

      if (!isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batchId.",
        });
      }

      const batch = await Batch.findById(batchId)
        .populate("teachers", "fullName email role")
        .populate("moderators", "fullName email role")
        .populate("createdBy", "fullName email role");

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Course not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: batch,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get course.",
        error: error.message,
      });
    }
  }

  static async updateBatch(req, res) {
    try {
      const { batchId } = req.params;

      if (!isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batchId.",
        });
      }

      const allowedFields = [
        "name",
        "slug",
        "description",
        "facebookGroupUrl",
        "monthlyFee",
        "currency",
        "paymentDueDay",
        "autoGenerateMonthlyDues",
        "status",
        "startsAt",
        "endsAt",
      ];

      const existingBatch = await Batch.findById(batchId);
      if (!existingBatch) {
        return res.status(404).json({
          success: false,
          message: "Course not found.",
        });
      }

      const payload = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          payload[field] = req.body[field];
        }
      }

      const hasBannerObjectUpdate = req.body.banner !== undefined || req.body.thumbnail !== undefined;
      const bannerPayload = req.body.bannerDataUri || req.body.bannerBase64;

      // Keep both fields in sync for backward compatibility.
      if (hasBannerObjectUpdate || bannerPayload) {
        let resolvedBanner = normalizeCloudinaryAsset(req.body.banner ?? req.body.thumbnail);
        if (bannerPayload) {
          resolvedBanner = await uploadImageFromDataUri(bannerPayload);
        }

        payload.banner = resolvedBanner;
        payload.thumbnail = resolvedBanner;

        const previousPublicId = existingBatch?.banner?.publicId || existingBatch?.thumbnail?.publicId;
        const nextPublicId = resolvedBanner?.publicId;
        if (previousPublicId && previousPublicId !== nextPublicId) {
          await deleteCloudinaryAssetByPublicId(previousPublicId);
        }
      }

      const updatedBatch = await Batch.findByIdAndUpdate(batchId, payload, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        message: "Course updated successfully.",
        data: updatedBatch,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Course name or slug already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update course.",
        error: error.message,
      });
    }
  }

  static async updateBatchStaff(req, res) {
    try {
      const { batchId } = req.params;
      const { teacherIds = [], moderatorIds = [] } = req.body;

      if (!isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batchId.",
        });
      }

      if (!Array.isArray(teacherIds) || !Array.isArray(moderatorIds)) {
        return res.status(400).json({
          success: false,
          message: "teacherIds and moderatorIds must be arrays.",
        });
      }

      const invalidTeacherId = teacherIds.find((id) => !isValidObjectId(id));
      const invalidModeratorId = moderatorIds.find((id) => !isValidObjectId(id));

      if (invalidTeacherId || invalidModeratorId) {
        return res.status(400).json({
          success: false,
          message: "One or more staff IDs are invalid.",
        });
      }

      const staffUsers = await User.find({
        _id: { $in: [...teacherIds, ...moderatorIds] },
      }).select("_id role");

      const roleMap = new Map(staffUsers.map((user) => [String(user._id), user.role]));

      const badTeacher = teacherIds.find((id) => roleMap.get(String(id)) !== "teacher");
      const badModerator = moderatorIds.find((id) => roleMap.get(String(id)) !== "moderator");

      if (badTeacher || badModerator) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid staff role assignment. teacherIds must contain teachers and moderatorIds must contain moderators.",
        });
      }

      const batch = await Batch.findByIdAndUpdate(
        batchId,
        { teachers: teacherIds, moderators: moderatorIds },
        { new: true, runValidators: true }
      )
        .populate("teachers", "fullName email role")
        .populate("moderators", "fullName email role");

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Course not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Course staff updated successfully.",
        data: batch,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update batch staff.",
        error: error.message,
      });
    }
  }

  static async listBatchStudents(req, res) {
    try {
      const { batchId } = req.params;

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
          message: "Forbidden to view students of this batch.",
        });
      }

      const approvedEnrollments = await EnrollmentRequest.find({
        batch: batchId,
        status: "approved",
      })
        .populate("student", "fullName email phone facebookProfileId profilePhoto role isActive")
        .populate("reviewedBy", "fullName role")
        .sort({ updatedAt: -1 });

      return res.status(200).json({
        success: true,
        count: approvedEnrollments.length,
        data: approvedEnrollments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list batch students.",
        error: error.message,
      });
    }
  }

  static async deleteBatch(req, res) {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batchId.",
      });
    }

    const session = await Batch.startSession();

    try {
      session.startTransaction();

      const batch = await Batch.findById(batchId).session(session);
      if (!batch) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Course not found.",
        });
      }

      await Video.deleteMany({ batch: batchId }, { session });
      await Chapter.deleteMany({ batch: batchId }, { session });
      await Subject.deleteMany({ batch: batchId }, { session });
      await EnrollmentRequest.deleteMany({ batch: batchId }, { session });
      await PaymentRecord.deleteMany({ batch: batchId }, { session });

      const bannerPublicId = batch?.banner?.publicId || batch?.thumbnail?.publicId;
      if (bannerPublicId) {
        await deleteCloudinaryAssetByPublicId(bannerPublicId);
      }

      await User.updateMany(
        { assignedBatches: batchId },
        { $pull: { assignedBatches: batchId } },
        { session }
      );

      await Batch.deleteOne({ _id: batchId }, { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Course and related records deleted successfully.",
      });
    } catch (error) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Failed to delete course.",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
}

module.exports = BatchController;
