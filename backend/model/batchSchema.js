const mongoose = require("mongoose");
const { BATCH_STATUSES } = require("./constants");
const { cloudinaryAssetSchema } = require("./subSchemas");

const batchSchema = new mongoose.Schema(
  {
    // Human readable batch label, e.g. "Target A+ Batch 2026".
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // URL-friendly identifier for frontend routes.
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Private Facebook group URL for this batch.
    facebookGroupUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Monthly subscription fee set by Admin.
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "BDT",
      uppercase: true,
      trim: true,
    },

    // Expected due day per month for payment generation.
    paymentDueDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 28,
    },

    autoGenerateMonthlyDues: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: BATCH_STATUSES,
      default: "upcoming",
      index: true,
    },

    startsAt: {
      type: Date,
    },

    endsAt: {
      type: Date,
    },

    // Course banner/thumbnail shown in course cards and headers.
    banner: cloudinaryAssetSchema,

    // Backward-compatible field used by old frontend builds.
    thumbnail: cloudinaryAssetSchema,

    // Owner should be Admin; enforced at controller/service layer.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Batch-level staff assignments for non-global staff.
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ status: 1, startsAt: 1 });

module.exports = mongoose.model("Batch", batchSchema);
