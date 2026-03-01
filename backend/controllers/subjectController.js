const Batch = require("../model/batchSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const Subject = require("../model/subjectSchema");
const Chapter = require("../model/chapterSchema");
const Video = require("../model/videoSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");

class SubjectController {
  static async createSubject(req, res) {
    try {
      const { batchId, title, description, displayOrder, isPublished } = req.body;

      if (!batchId || !title) {
        return res.status(400).json({
          success: false,
          message: "batchId and title are required.",
        });
      }

      if (!isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batchId.",
        });
      }

      const batch = await Batch.findById(batchId).select("_id");
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, batchId));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to create subject in this batch.",
        });
      }

      const subject = await Subject.create({
        batch: batchId,
        title,
        description,
        displayOrder,
        isPublished,
        createdBy: req.user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Subject created successfully.",
        data: subject,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Subject title already exists in this batch.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create subject.",
        error: error.message,
      });
    }
  }

  static async listSubjects(req, res) {
    try {
      const { batchId } = req.query;

      if (!batchId || !isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Valid batchId query is required.",
        });
      }

      let hasAccess = false;

      if (req.user.role === "student") {
        const approvedEnrollment = await EnrollmentRequest.exists({
          student: req.user._id,
          batch: batchId,
          status: "approved",
        });
        hasAccess = Boolean(approvedEnrollment);
      } else {
        hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, batchId));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to view subjects for this batch.",
        });
      }

      const subjects = await Subject.find({ batch: batchId })
        .populate("createdBy", "fullName role")
        .sort({ displayOrder: 1, createdAt: 1 });

      return res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list subjects.",
        error: error.message,
      });
    }
  }

  static async getSubjectById(req, res) {
    try {
      const { subjectId } = req.params;

      if (!isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId.",
        });
      }

      const subject = await Subject.findById(subjectId).populate("createdBy", "fullName role");
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found.",
        });
      }

      let hasAccess = false;

      if (req.user.role === "student") {
        const approvedEnrollment = await EnrollmentRequest.exists({
          student: req.user._id,
          batch: subject.batch,
          status: "approved",
        });
        hasAccess = Boolean(approvedEnrollment);
      } else {
        hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, subject.batch));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to view this subject.",
        });
      }

      return res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get subject.",
        error: error.message,
      });
    }
  }

  static async updateSubject(req, res) {
    try {
      const { subjectId } = req.params;

      if (!isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId.",
        });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, subject.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to update subject in this batch.",
        });
      }

      const allowedFields = ["title", "description", "displayOrder", "isPublished"];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          subject[field] = req.body[field];
        }
      }

      await subject.save();

      return res.status(200).json({
        success: true,
        message: "Subject updated successfully.",
        data: subject,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Subject title already exists in this batch.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update subject.",
        error: error.message,
      });
    }
  }

  static async deleteSubject(req, res) {
    const session = await Subject.startSession();

    try {
      const { subjectId } = req.params;

      if (!isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId.",
        });
      }

      const subject = await Subject.findById(subjectId).select("_id batch");
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, subject.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to delete subject in this batch.",
        });
      }

      session.startTransaction();

      await Video.deleteMany({ subject: subjectId }, { session });
      await Chapter.deleteMany({ subject: subjectId }, { session });
      await Subject.deleteOne({ _id: subjectId }, { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Subject and related chapters/videos deleted successfully.",
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return res.status(500).json({
        success: false,
        message: "Failed to delete subject.",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
}

module.exports = SubjectController;
