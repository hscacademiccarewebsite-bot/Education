const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const AuthMiddleware = require("../middlewares/authMiddleware");

router.post("/register", AuthMiddleware.requireAuth, UserController.registerUser);
router.get("/me", AuthMiddleware.requireAuth, UserController.getCurrentUser);
router.patch("/me", AuthMiddleware.requireAuth, UserController.updateCurrentUser);
router.get(
  "/",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRoles("admin"),
  UserController.listUsers
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
