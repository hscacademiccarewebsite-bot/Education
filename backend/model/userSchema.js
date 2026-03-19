const mongoose = require("mongoose");
const { USER_ROLES } = require("./constants");
const { cloudinaryAssetSchema } = require("./subSchemas");

const userSchema = new mongoose.Schema(
  {
    // Firebase Auth UID used as the source of truth for authentication identity.
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    school: {
      type: String,
      trim: true,
    },

    college: {
      type: String,
      trim: true,
    },

    // RBAC role assignment.
    role: {
      type: String,
      enum: USER_ROLES,
      default: "student",
      index: true,
    },

    // Optional social profile field used in admission context.
    facebookProfileId: {
      type: String,
      trim: true,
    },

    // Teacher's university/varsity information
    varsity: {
      type: String,
      trim: true,
    },

    // Teacher's years of experience (e.g. "12+ Years")
    experience: {
      type: String,
      trim: true,
    },

    profilePhoto: cloudinaryAssetSchema,

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Teachers/Moderators can be restricted to specific batches.
    assignedBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);
