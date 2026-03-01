const express = require("express");
const EnrollmentRequestController = require("../controllers/enrollmentRequestController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);

router.post(
  "/",
  AuthMiddleware.requireRoles("student"),
  EnrollmentRequestController.createEnrollmentRequest
);

router.get(
  "/my",
  AuthMiddleware.requireRoles("student"),
  EnrollmentRequestController.getMyEnrollmentRequests
);

router.get(
  "/review",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  EnrollmentRequestController.listEnrollmentRequestsForReview
);

router.patch(
  "/:enrollmentId/status",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  EnrollmentRequestController.reviewEnrollmentRequest
);

module.exports = router;
