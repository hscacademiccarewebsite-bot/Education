const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isGlobalAdmin: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["payment_success", "payment_due", "new_video", "new_note", "system", "offline_payment_verified", "new_comment", "new_like", "new_reply", "comment_like", "new_mention"],
      default: "system",
    },
    link: {
      type: String, // URL where the notification redirects
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For any extra ID tracking
    },
  },
  { timestamps: true }
);

// Indexes to speed up queries for user unread dropdowns
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ isGlobalAdmin: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
