const express = require("express");
const router = express.Router();
const SharedNoteController = require("../controllers/sharedNoteController");
const AuthMiddleware = require("../middlewares/authMiddleware");

router.post("/", AuthMiddleware.requireAuth, SharedNoteController.createNote);
router.get("/", AuthMiddleware.requireAuth, SharedNoteController.getNotes);
router.patch("/:noteId", AuthMiddleware.requireAuth, SharedNoteController.updateNote);
router.delete("/:noteId", AuthMiddleware.requireAuth, SharedNoteController.deleteNote);

module.exports = router;
