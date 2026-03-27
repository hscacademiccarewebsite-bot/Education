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
  EnrollmentRequestController.getMyEnrollmentRequests
);

router.get(
  "/review",
  AuthMiddleware.requireRoles("admin", "moderator"),
  EnrollmentRequestController.listEnrollmentRequestsForReview
);

router.patch(
  "/:enrollmentId/status",
  AuthMiddleware.requireRoles("admin", "moderator"),
  EnrollmentRequestController.reviewEnrollmentRequest
);

router.patch(
  "/:enrollmentId/kickout",
  AuthMiddleware.requireRoles("admin", "moderator"),
  EnrollmentRequestController.kickOutEnrollment
);

module.exports = router;
