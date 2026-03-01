const Chapter = require("../model/chapterSchema");
const Video = require("../model/videoSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const Subject = require("../model/subjectSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");

class ChapterController {
  static async createChapter(req, res) {
    try {
      const { subjectId, batchId, title, description, displayOrder, isPublished } = req.body;

      if (!subjectId || !title) {
        return res.status(400).json({
          success: false,
          message: "subjectId and title are required.",
        });
      }

      if (!isValidObjectId(subjectId) || (batchId && !isValidObjectId(batchId))) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId or batchId.",
        });
      }

      const subject = await Subject.findById(subjectId).select("_id batch");
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found.",
        });
      }

      if (batchId && String(subject.batch) !== String(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Subject does not belong to the provided batch.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, subject.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to create chapter in this batch.",
        });
      }

      const chapter = await Chapter.create({
        batch: subject.batch,
        subject: subject._id,
        title,
        description,
        displayOrder,
        isPublished,
        createdBy: req.user._id,
      });

      return res.status(201).json({
        success: true,
        message: "Chapter created successfully.",
        data: chapter,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Chapter title already exists in this subject.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create chapter.",
        error: error.message,
      });
    }
  }

  static async listChapters(req, res) {
    try {
      const { subjectId } = req.query;

      if (!subjectId || !isValidObjectId(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Valid subjectId query is required.",
        });
      }

      const subject = await Subject.findById(subjectId).select("_id batch");
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
          message: "Forbidden to view chapters for this subject.",
        });
      }

      const chapters = await Chapter.find({ subject: subjectId })
        .populate("createdBy", "fullName role")
        .sort({ displayOrder: 1, createdAt: 1 });

      return res.status(200).json({
        success: true,
        count: chapters.length,
        data: chapters,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list chapters.",
        error: error.message,
      });
    }
  }

  static async getChapterById(req, res) {
    try {
      const { chapterId } = req.params;

      if (!isValidObjectId(chapterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapterId.",
        });
      }

      const chapter = await Chapter.findById(chapterId).populate("createdBy", "fullName role");
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found.",
        });
      }

      let hasAccess = false;

      if (req.user.role === "student") {
        const approvedEnrollment = await EnrollmentRequest.exists({
          student: req.user._id,
          batch: chapter.batch,
          status: "approved",
        });
        hasAccess = Boolean(approvedEnrollment);
      } else {
        hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, chapter.batch));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to view this chapter.",
        });
      }

      return res.status(200).json({
        success: true,
        data: chapter,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get chapter.",
        error: error.message,
      });
    }
  }

  static async updateChapter(req, res) {
    try {
      const { chapterId } = req.params;

      if (!isValidObjectId(chapterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapterId.",
        });
      }

      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, chapter.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to update chapter in this batch.",
        });
      }

      const allowedFields = ["title", "description", "displayOrder", "isPublished"];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          chapter[field] = req.body[field];
        }
      }

      await chapter.save();

      return res.status(200).json({
        success: true,
        message: "Chapter updated successfully.",
        data: chapter,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Chapter title already exists in this subject.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update chapter.",
        error: error.message,
      });
    }
  }

  static async deleteChapter(req, res) {
    const session = await Chapter.startSession();

    try {
      const { chapterId } = req.params;

      if (!isValidObjectId(chapterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapterId.",
        });
      }

      const chapter = await Chapter.findById(chapterId).select("_id batch");
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, chapter.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to delete chapter in this batch.",
        });
      }

      session.startTransaction();

      await Video.deleteMany({ chapter: chapterId }, { session });
      await Chapter.deleteOne({ _id: chapterId }, { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Chapter and related videos deleted successfully.",
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return res.status(500).json({
        success: false,
        message: "Failed to delete chapter.",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }
}

module.exports = ChapterController;
