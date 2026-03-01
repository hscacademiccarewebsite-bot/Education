const express = require("express");
const SubjectController = require("../controllers/subjectController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", SubjectController.listSubjects);
router.get("/:subjectId", SubjectController.getSubjectById);

router.post(
  "/",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  SubjectController.createSubject
);

router.patch(
  "/:subjectId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  SubjectController.updateSubject
);

router.delete(
  "/:subjectId",
  AuthMiddleware.requireRoles("admin", "teacher", "moderator"),
  SubjectController.deleteSubject
);

module.exports = router;
