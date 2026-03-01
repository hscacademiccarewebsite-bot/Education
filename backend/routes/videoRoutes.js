const express = require("express");
const VideoController = require("../controllers/videoController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", VideoController.listVideos);
router.get("/:videoId", VideoController.getVideoById);

router.post(
  "/",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  VideoController.createVideo
);

router.patch(
  "/:videoId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  VideoController.updateVideo
);

router.delete(
  "/:videoId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  VideoController.deleteVideo
);

module.exports = router;
