const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
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
    googleDriveLink: {
      type: String,
      required: true,
      trim: true,
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

// One title per subject (optional, but keep it clean)
noteSchema.index({ subject: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Note", noteSchema);
