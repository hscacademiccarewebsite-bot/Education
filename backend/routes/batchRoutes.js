const express = require("express");
const BatchController = require("../controllers/batchController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", AuthMiddleware.optionalAuth, BatchController.listBatches);
router.get("/:batchId", AuthMiddleware.optionalAuth, BatchController.getBatchById);

router.use(AuthMiddleware.requireAuth);

router.get(
  "/:batchId/students",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  BatchController.listBatchStudents
);

router.post("/", AuthMiddleware.requireRoles("admin"), BatchController.createBatch);
router.patch("/:batchId", AuthMiddleware.requireRoles("admin"), BatchController.updateBatch);
router.delete("/:batchId", AuthMiddleware.requireRoles("admin"), BatchController.deleteBatch);
router.patch("/:batchId/staff", AuthMiddleware.requireRoles("admin"), BatchController.updateBatchStaff);

module.exports = router;
