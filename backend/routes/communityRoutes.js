const express = require("express");
const router = express.Router();
const CommunityController = require("../controllers/communityController");
const AuthMiddleware = require("../middlewares/authMiddleware");

// All community routes require authentication
router.use(AuthMiddleware.requireAuth);

router.post("/posts", CommunityController.createPost);
router.get("/posts", CommunityController.getPosts);
router.get("/posts/:postId", CommunityController.getPostById);
router.post("/posts/:postId/like", CommunityController.likePost);
router.put("/posts/:postId", CommunityController.editPost);
router.delete("/posts/:postId", CommunityController.deletePost);
router.post("/posts/:postId/comments", CommunityController.addComment);
router.get("/posts/:postId/comments", CommunityController.getComments);
router.post("/comments/:commentId/like", CommunityController.likeComment);
router.put("/comments/:commentId", CommunityController.editComment);
router.delete("/comments/:commentId", CommunityController.deleteComment);

module.exports = router;
