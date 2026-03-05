const mongoose = require("mongoose");
const { ENROLLMENT_STATUSES } = require("./constants");
const { cloudinaryAssetSchema } = require("./subSchemas");

const enrollmentRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    // Snapshot of application form values at submission time.
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },

    applicantFacebookId: {
      type: String,
      required: true,
      trim: true,
    },

    applicantPhoto: {
      type: cloudinaryAssetSchema,
      required: true,
    },

    applicantPhone: {
      type: String,
      trim: true,
    },

    note: {
      type: String,
      trim: true,
    },

    // Student confirms they already sent a join request to private course group.
    facebookGroupJoinRequested: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One enrollment request per student per batch.
enrollmentRequestSchema.index({ student: 1, batch: 1 }, { unique: true });
enrollmentRequestSchema.index({ batch: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("EnrollmentRequest", enrollmentRequestSchema);
