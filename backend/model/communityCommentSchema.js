const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityComment",
      default: null,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: false,
      trim: true,
    },
    images: [require("./subSchemas").cloudinaryAssetSchema],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

communityCommentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model("CommunityComment", communityCommentSchema);
