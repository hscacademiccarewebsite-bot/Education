const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const AuthMiddleware = require("../middlewares/authMiddleware");

router.post("/register", AuthMiddleware.requireAuth, UserController.registerUser);
router.get("/me", AuthMiddleware.requireAuth, UserController.getCurrentUser);
router.get("/search", AuthMiddleware.requireAuth, UserController.searchUsers);
router.patch("/me", AuthMiddleware.requireAuth, UserController.updateCurrentUser);
router.get(
  "/academic-batches",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.listAcademicBatches
);
router.patch(
  "/:userId/graduation-status",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.updateGraduationStatus
);
router.patch(
  "/academic-batches/:batchYear/graduation-status",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.updateBatchGraduationStatus
);
router.get("/:userId/profile", AuthMiddleware.requireAuth, UserController.getPublicProfile);
router.get(
  "/",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.listUsers
);
router.get(
  "/:userId/details",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  UserController.getUserDetails
);
router.patch(
  "/:userId/role",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.updateUserRole
);
router.patch(
  "/:userId/assign-batches",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.assignBatchesToStaff
);

module.exports = router;
