const express = require("express");
const AnalyticsController = require("../controllers/analyticsController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth, AuthMiddleware.requireRoles("admin"));

router.get("/admin-overview", AnalyticsController.getAdminOverview);
router.get("/admin-report", AnalyticsController.downloadAdminReport);

module.exports = router;
