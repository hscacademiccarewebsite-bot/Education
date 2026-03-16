const Notification = require("../model/notificationSchema");

class NotificationController {
  // Fetch paginated notifications for the current user
  static async getMyNotifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Filter: If user is admin/super_admin, they see globalAdmin notifications AND their personal ones.
      // If student, they only see personal ones.
      let query = {};
      if (req.user.role === "admin" || req.user.role === "super_admin") {
        query = {
          $or: [
            { isGlobalAdmin: true },
            { recipient: req.user._id }
          ]
        };
      } else {
        query = { recipient: req.user._id, isGlobalAdmin: false };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("[Get Notifications Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
  }

  // Get unread count for the bell polling
  static async getUnreadCount(req, res) {
    try {
      let query = {};
      if (req.user.role === "admin" || req.user.role === "super_admin") {
        query = {
          $or: [
            { isGlobalAdmin: true, isRead: false },
            { recipient: req.user._id, isRead: false }
          ]
        };
      } else {
        query = { recipient: req.user._id, isGlobalAdmin: false, isRead: false };
      }

      const count = await Notification.countDocuments(query);

      res.status(200).json({ success: true, count });
    } catch (error) {
      console.error("[Unread Count Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch unread count" });
    }
  }

  // Mark single notification as read
  static async markAsRead(req, res) {
    try {
      const notificationId = req.params.id;
      
      // Allow marking if it's yours OR if it's a global admin and you're an admin
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      // Permissions check
      const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
      if (!isAdmin && String(notification.recipient) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      console.error("[Mark Read Error]:", error);
      res.status(500).json({ success: false, message: "Failed to mark as read" });
    }
  }

  // Mark all as read
  static async markAllAsRead(req, res) {
    try {
      let query = {};
      if (req.user.role === "admin" || req.user.role === "super_admin") {
        query = {
          $or: [
            { isGlobalAdmin: true, isRead: false },
            { recipient: req.user._id, isRead: false }
          ]
        };
      } else {
        query = { recipient: req.user._id, isGlobalAdmin: false, isRead: false };
      }

      await Notification.updateMany(query, { $set: { isRead: true } });

      res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error("[Mark All Read Error]:", error);
      res.status(500).json({ success: false, message: "Failed to mark all as read" });
    }
  }
}

module.exports = NotificationController;
