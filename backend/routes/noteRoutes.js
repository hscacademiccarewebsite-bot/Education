const express = require("express");
const router = express.Router();
const {
  createNote,
  getNotesBySubject,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const staffOnly = AuthMiddleware.requireRoles("admin", "teacher", "moderator");

// Public (with enrollment check in controller)
router.get("/", AuthMiddleware.requireAuth, getNotesBySubject);

// Staff only
router.post("/", AuthMiddleware.requireAuth, staffOnly, createNote);
router.patch("/:noteId", AuthMiddleware.requireAuth, staffOnly, updateNote);
router.delete("/:noteId", AuthMiddleware.requireAuth, staffOnly, deleteNote);

module.exports = router;
