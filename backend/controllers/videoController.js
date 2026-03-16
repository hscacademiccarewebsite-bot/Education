const Video = require("../model/videoSchema");
const Chapter = require("../model/chapterSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const Notification = require("../model/notificationSchema");
const { canAccessBatch, isAdmin, isValidObjectId } = require("../utils/batchAccess");

const buildFacebookVideoUrl = (facebookVideoId) => {
  if (!facebookVideoId) {
    return "";
  }

  const normalizedId = String(facebookVideoId).trim();
  if (!normalizedId) {
    return "";
  }

  return `https://www.facebook.com/watch/?v=${normalizedId}`;
};

class VideoController {
  static async createVideo(req, res) {
    try {
      const {
        chapterId,
        subjectId,
        batchId,
        title,
        description,
        facebookVideoUrl,
        facebookVideoId,
        displayOrder,
        durationInMinutes,
        isPreview,
        isPublished,
      } = req.body;

      const generatedVideoUrl = facebookVideoUrl || buildFacebookVideoUrl(facebookVideoId);

      if (!chapterId || !title || !generatedVideoUrl) {
        return res.status(400).json({
          success: false,
          message: "chapterId, title and facebookVideoId or facebookVideoUrl are required.",
        });
      }

      if (
        !isValidObjectId(chapterId) ||
        (subjectId && !isValidObjectId(subjectId)) ||
        (batchId && !isValidObjectId(batchId))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapterId, subjectId or batchId.",
        });
      }

      const chapter = await Chapter.findById(chapterId).select("_id batch subject");
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found.",
        });
      }

      if (subjectId && String(chapter.subject) !== String(subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Chapter does not belong to the provided subject.",
        });
      }

      if (batchId && String(chapter.batch) !== String(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Chapter does not belong to the provided batch.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, chapter.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to create video in this batch.",
        });
      }

      const video = await Video.create({
        batch: chapter.batch,
        subject: chapter.subject,
        chapter: chapter._id,
        title,
        description,
        facebookVideoUrl: generatedVideoUrl,
        facebookVideoId,
        displayOrder,
        durationInMinutes,
        isPreview,
        isPublished,
        createdBy: req.user._id,
      });

      // --- Broadcast Notification to Students ---
      if (video.isPublished) {
        try {
          // Store IDs as strings to ensure valid URLs even after population
          const bId = String(chapter.batch);
          const sId = String(chapter.subject);
          const cId = String(chapter._id);

          // Find all students approved for this batch
          const enrollments = await EnrollmentRequest.find({
            batch: bId,
            status: "approved",
          }).select("student");

          if (enrollments.length > 0) {
            // Populate to get the name for the message
            await chapter.populate("batch", "name");
            const batchName = chapter.batch?.name || "your course";

            const newNotifications = enrollments.map((enrollment) => ({
              recipient: enrollment.student,
              title: "New Video Uploaded",
              message: `A new video "${title}" was just added to ${batchName}.`,
              type: "new_video",
              link: `/chapters/${cId}`,
            }));

            // Bulk insert for efficiency
            await Notification.insertMany(newNotifications);
            console.log(`Successfully sent ${newNotifications.length} notifications for new video.`);
          }
        } catch (notifErr) {
          console.error("Failed to broadcast new_video notifications:", notifErr);
        }
      }

      return res.status(201).json({
        success: true,
        message: "Video created successfully.",
        data: video,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create video.",
        error: error.message,
      });
    }
  }

  static async listVideos(req, res) {
    try {
      const { chapterId } = req.query;

      if (!chapterId || !isValidObjectId(chapterId)) {
        return res.status(400).json({
          success: false,
          message: "Valid chapterId query is required.",
        });
      }

      const chapter = await Chapter.findById(chapterId).select("_id batch");
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
          message: "Forbidden to view videos for this chapter.",
        });
      }

      const videos = await Video.find({ chapter: chapterId })
        .populate("createdBy", "fullName role")
        .sort({ displayOrder: 1, createdAt: 1 });

      return res.status(200).json({
        success: true,
        count: videos.length,
        data: videos,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list videos.",
        error: error.message,
      });
    }
  }

  static async getVideoById(req, res) {
    try {
      const { videoId } = req.params;

      if (!isValidObjectId(videoId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid videoId.",
        });
      }

      const video = await Video.findById(videoId).populate("createdBy", "fullName role");
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      let hasAccess = false;

      if (req.user.role === "student") {
        const approvedEnrollment = await EnrollmentRequest.exists({
          student: req.user._id,
          batch: video.batch,
          status: "approved",
        });
        hasAccess = Boolean(approvedEnrollment);
      } else {
        hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, video.batch));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to view this video.",
        });
      }

      return res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get video.",
        error: error.message,
      });
    }
  }

  static async updateVideo(req, res) {
    try {
      const { videoId } = req.params;

      if (!isValidObjectId(videoId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid videoId.",
        });
      }

      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, video.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to update video in this batch.",
        });
      }

      const allowedFields = [
        "title",
        "description",
        "facebookVideoId",
        "facebookVideoUrl",
        "displayOrder",
        "durationInMinutes",
        "isPreview",
        "isPublished",
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          video[field] = req.body[field];
        }
      }

      if (req.body.facebookVideoId !== undefined && req.body.facebookVideoUrl === undefined) {
        video.facebookVideoUrl = buildFacebookVideoUrl(req.body.facebookVideoId);
      }

      if (!String(video.facebookVideoUrl || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "facebookVideoId or facebookVideoUrl is required.",
        });
      }

      await video.save();

      return res.status(200).json({
        success: true,
        message: "Video updated successfully.",
        data: video,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update video.",
        error: error.message,
      });
    }
  }

  static async deleteVideo(req, res) {
    try {
      const { videoId } = req.params;

      if (!isValidObjectId(videoId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid videoId.",
        });
      }

      const video = await Video.findById(videoId).select("_id batch");
      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      const hasAccess = isAdmin(req.user) || (await canAccessBatch(req.user, video.batch));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Forbidden to delete video in this batch.",
        });
      }

      await Video.findByIdAndDelete(videoId);

      return res.status(200).json({
        success: true,
        message: "Video deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete video.",
        error: error.message,
      });
    }
  }
}

module.exports = VideoController;
