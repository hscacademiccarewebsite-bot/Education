const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Private Facebook group/class video URL.
    facebookVideoUrl: {
      type: String,
      required: true,
      trim: true,
    },

    facebookVideoId: {
      type: String,
      trim: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationInMinutes: {
      type: Number,
      min: 0,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ chapter: 1, displayOrder: 1 });
videoSchema.index({ batch: 1, subject: 1, chapter: 1 });

module.exports = mongoose.model("Video", videoSchema);
