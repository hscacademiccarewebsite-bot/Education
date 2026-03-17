const mongoose = require("mongoose");

const sharedNoteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    googleDriveLink: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    privacy: {
      type: String,
      enum: ["public", "enrolled_members"],
      default: "public",
    },
    enrolledBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SharedNote", sharedNoteSchema);
