const express = require("express");
const AuthMiddleware = require("../middlewares/authMiddleware");
const NotificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", AuthMiddleware.requireAuth, NotificationController.getMyNotifications);
router.get("/unread-count", AuthMiddleware.requireAuth, NotificationController.getUnreadCount);
router.put("/read-all", AuthMiddleware.requireAuth, NotificationController.markAllAsRead);
router.put("/:id/read", AuthMiddleware.requireAuth, NotificationController.markAsRead);

module.exports = router;
