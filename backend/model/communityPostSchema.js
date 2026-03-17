const mongoose = require("mongoose");
const { cloudinaryAssetSchema } = require("./subSchemas");

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: false,
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
    images: [cloudinaryAssetSchema],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CommunityPost", communityPostSchema);
