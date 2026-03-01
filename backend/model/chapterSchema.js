const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    // Denormalized batch reference for faster filtering and RBAC checks.
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
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

chapterSchema.index({ subject: 1, title: 1 }, { unique: true });
chapterSchema.index({ batch: 1, subject: 1, displayOrder: 1 });

module.exports = mongoose.model("Chapter", chapterSchema);
