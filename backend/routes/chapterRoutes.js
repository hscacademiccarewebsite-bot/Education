const express = require("express");
const ChapterController = require("../controllers/chapterController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", ChapterController.listChapters);
router.get("/:chapterId", ChapterController.getChapterById);

router.post(
  "/",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  ChapterController.createChapter
);

router.patch(
  "/:chapterId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  ChapterController.updateChapter
);

router.delete(
  "/:chapterId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  ChapterController.deleteChapter
);

module.exports = router;
