const CommunityPost = require("../model/communityPostSchema");
const CommunityComment = require("../model/communityCommentSchema");
const Notification = require("../model/notificationSchema");
const User = require("../model/userSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");

// Helper to get batch IDs a student is approved for
async function getStudentBatchIds(studentId) {
  const userEnrollments = await EnrollmentRequest.find({
    student: studentId,
    status: "approved",
  }).select("batch");
  return userEnrollments.map((e) => String(e.batch));
}

class CommunityController {
  // Create a new post
  static async createPost(req, res) {
    try {
      const { content, images, privacy, enrolledBatches } = req.body;

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Post content or image is required.",
        });
      }

      if (privacy === "enrolled_members" && (!enrolledBatches || enrolledBatches.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "You must select at least one course when sharing with Enrolled Members.",
        });
      }

      const post = await CommunityPost.create({
        author: req.user._id,
        content,
        privacy: privacy || "public",
        enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
        images: images || [],
      });

      const populatedPost = await post.populate("author", "fullName profilePhoto role");

      res.status(201).json({
        success: true,
        message: "Post created successfully.",
        data: populatedPost,
      });
    } catch (error) {
      console.error("[Create Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to create post." });
    }
  }

  // Get all posts with pagination
  static async getPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build privacy filter
      let query = {};
      if (req.user.role === "student") {
        const myBatchIds = await getStudentBatchIds(req.user._id);
        query = {
          $or: [
            { privacy: "public" },
            { author: req.user._id },
            { 
              privacy: "enrolled_members", 
              enrolledBatches: { $in: myBatchIds } 
            }
          ]
        };
      }

      const posts = await CommunityPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "fullName profilePhoto role");

      const total = await CommunityPost.countDocuments(query);

      // Add "isLiked" field for each post
      const postsWithLikeStatus = posts.map((post) => {
        const postObj = post.toObject();
        postObj.isLiked = post.likes.some(
          (likeId) => String(likeId) === String(req.user._id)
        );
        postObj.likesCount = post.likes.length;
        delete postObj.likes; // Don't send all like IDs to frontend
        return postObj;
      });

      res.status(200).json({
        success: true,
        data: postsWithLikeStatus,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("[Get Posts Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch posts." });
    }
  }

  // Like/Unlike a post
  static async likePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      const isLiked = post.likes.some((id) => String(id) === String(userId));

      if (isLiked) {
        // Unlike
        post.likes = post.likes.filter((id) => String(id) !== String(userId));
      } else {
        // Like
        post.likes.push(userId);

        // Create notification for post owner if it's not the owner themselves
        if (String(post.author) !== String(userId)) {
          await Notification.create({
            recipient: post.author,
            title: "New Like",
            message: `${req.user.fullName} liked your post.`,
            type: "new_like",
            link: `/community/posts/${post._id}`,
            metadata: { postId: post._id },
          });
        }
      }

      await post.save();

      res.status(200).json({
        success: true,
        isLiked: !isLiked,
        likesCount: post.likes.length,
      });
    } catch (error) {
      console.error("[Like Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to update like status." });
    }
  }

  // Edit a post
  static async editPost(req, res) {
    try {
      const { postId } = req.params;
      const { content, images } = req.body;
      const userId = req.user._id;

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      if (String(post.author) !== String(userId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to edit this post." });
      }

      post.content = content || post.content;
      if (images) post.images = images;

      await post.save();

      res.status(200).json({
        success: true,
        message: "Post updated successfully.",
        data: await post.populate("author", "fullName profilePhoto role"),
      });
    } catch (error) {
      console.error("[Edit Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to update post." });
    }
  }

  // Delete a post
  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      if (String(post.author) !== String(userId) && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this post." });
      }

      // Delete the post
      await CommunityPost.findByIdAndDelete(postId);

      // Delete all comments associated with this post
      await CommunityComment.deleteMany({ post: postId });

      res.status(200).json({
        success: true,
        message: "Post deleted successfully.",
      });
    } catch (error) {
      console.error("[Delete Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to delete post." });
    }
  }

  // Add a comment
  static async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { content, parentId, images } = req.body;

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({ success: false, message: "Comment content or image is required." });
      }

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      // If it's a reply, check if parent comment exists
      if (parentId) {
        const parentComment = await CommunityComment.findById(parentId);
        if (!parentComment) {
          return res.status(404).json({ success: false, message: "Parent comment not found." });
        }
        parentComment.repliesCount += 1;
        await parentComment.save();
      }

      const comment = await CommunityComment.create({
        post: postId,
        author: req.user._id,
        content,
        parentId: parentId || null,
        images: images || [],
      });

      // Update comment count on post (only for top-level comments or all? usually all in simple stats)
      post.commentsCount += 1;
      await post.save();

      const populatedComment = await comment.populate("author", "fullName profilePhoto role");

      // Notification logic
      if (parentId) {
        // Notify parent comment author
        const parentCommentDocs = await CommunityComment.findById(parentId);
        if (parentCommentDocs && String(parentCommentDocs.author) !== String(req.user._id)) {
          await Notification.create({
            recipient: parentCommentDocs.author,
            title: "New Reply",
            message: `${req.user.fullName} replied to your comment.`,
            type: "new_reply",
            link: `/community/posts/${postId}?commentId=${comment._id}`,
            metadata: { postId, commentId: comment._id, parentId },
          });
        }
      } else if (String(post.author) !== String(req.user._id)) {
        // Notify post author (only if it's a top-level comment)
        await Notification.create({
          recipient: post.author,
          title: "New Comment",
          message: `${req.user.fullName} commented on your post.`,
          type: "new_comment",
          link: `/community/posts/${postId}?commentId=${comment._id}`,
          metadata: { postId, commentId: comment._id },
        });
      }

      // Mention logic: Parse @[userId] (Name)
      const mentionRegex = /@\[([a-f\d]{24})\]/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedUserId = match[1];
        if (String(mentionedUserId) !== String(req.user._id) && !mentions.includes(mentionedUserId)) {
          mentions.push(mentionedUserId);
        }
      }

      if (mentions.length > 0) {
        for (const mentionId of mentions) {
          // Avoid duplicate notification if already notified as post author/parent author
          const isPostAuthor = String(post.author) === String(mentionId);
          // (Simple check for now, could be more robust)
          
          await Notification.create({
            recipient: mentionId,
            title: "New Mention",
            message: `${req.user.fullName} mentioned you in a comment.`,
            type: "new_mention",
            link: `/community/posts/${postId}?commentId=${comment._id}`,
            metadata: { postId, commentId: comment._id },
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Comment added successfully.",
        data: populatedComment,
      });
    } catch (error) {
      console.error("[Add Comment Error]:", error);
      res.status(500).json({ success: false, message: "Failed to add comment." });
    }
  }

  // Get comments for a post
  static async getComments(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50; // Increased limit for nested threads
      const skip = (page - 1) * limit;

      // For simplicity in a small community, we fetch all comments and replies for a post
      // and let the frontend handle the tree structure. 
      const comments = await CommunityComment.find({ post: postId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "fullName profilePhoto role");

      const total = await CommunityComment.countDocuments({ post: postId });

      const commentsWithStatus = comments.map((comment) => {
        const commentObj = comment.toObject();
        commentObj.isLiked = comment.likes.some(
          (id) => String(id) === String(req.user._id)
        );
        commentObj.likesCount = comment.likes.length;
        delete commentObj.likes;
        return commentObj;
      });

      res.status(200).json({
        success: true,
        data: commentsWithStatus,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("[Get Comments Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch comments." });
    }
  }

  // Like/Unlike a comment
  static async likeComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const comment = await CommunityComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
      }

      const isLiked = comment.likes.some((id) => String(id) === String(userId));

      if (isLiked) {
        comment.likes = comment.likes.filter((id) => String(id) !== String(userId));
      } else {
        comment.likes.push(userId);
        
        // Notify comment author
        if (String(comment.author) !== String(userId)) {
          await Notification.create({
            recipient: comment.author,
            title: "Comment Like",
            message: `${req.user.fullName} liked your comment.`,
            type: "comment_like",
            link: `/community/posts/${comment.post}?commentId=${comment._id}`,
            metadata: { commentId: comment._id, postId: comment.post },
          });
        }
      }

      await comment.save();

      res.status(200).json({
        success: true,
        isLiked: !isLiked,
        likesCount: comment.likes.length,
      });
    } catch (error) {
      console.error("[Like Comment Error]:", error);
      res.status(500).json({ success: false, message: "Failed to update comment like status." });
    }
  }
  // Edit a comment
  static async editComment(req, res) {
    try {
      const { commentId } = req.params;
      const { content, images } = req.body;
      const userId = req.user._id;

      const comment = await CommunityComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
      }

      if (String(comment.author) !== String(userId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to edit this comment." });
      }

      comment.content = content || comment.content;
      if (images) comment.images = images;
      
      await comment.save();

      res.status(200).json({
        success: true,
        message: "Comment updated successfully.",
        data: await comment.populate("author", "fullName profilePhoto role"),
      });
    } catch (error) {
      console.error("[Edit Comment Error]:", error);
      res.status(500).json({ success: false, message: "Failed to update comment." });
    }
  }

  // Delete a comment
  static async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const comment = await CommunityComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
      }

      const post = await CommunityPost.findById(comment.post);

      // Comment author or Post author can delete the comment
      const isCommentAuthor = String(comment.author) === String(userId);
      const isPostAuthor = post && String(post.author) === String(userId);

      if (!isCommentAuthor && !isPostAuthor) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete this comment." });
      }

      // Update counters
      if (post) {
        post.commentsCount = Math.max(0, post.commentsCount - 1);
        await post.save();
      }

      if (comment.parentId) {
        const parentComment = await CommunityComment.findById(comment.parentId);
        if (parentComment) {
          parentComment.repliesCount = Math.max(0, parentComment.repliesCount - 1);
          await parentComment.save();
        }
      }

      await CommunityComment.findByIdAndDelete(commentId);
      
      // Also delete all replies to this comment (recursively or just one level?)
      // For simplicity, let's delete the first level. In a full system, you'd want recursion.
      await CommunityComment.deleteMany({ parentId: commentId });

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully.",
      });
    } catch (error) {
      console.error("[Delete Comment Error]:", error);
      res.status(500).json({ success: false, message: "Failed to delete comment." });
    }
  }
  // Get a single post by ID
  static async getPostById(req, res) {
    try {
      const { postId } = req.params;
      const post = await CommunityPost.findById(postId).populate("author", "fullName profilePhoto role");

      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      // Privacy check
      if (req.user.role === "student" && post.privacy === "enrolled_members" && String(post.author._id) !== String(req.user._id)) {
        const myBatchIds = await getStudentBatchIds(req.user._id);
        // Does the post's target batches intersect with my approved batches?
        const hasAccess = post.enrolledBatches.some(batchId => myBatchIds.includes(String(batchId)));
        
        if (!hasAccess) {
          return res.status(403).json({ success: false, message: "You do not have permission to view this post. You must be enrolled in the target course." });
        }
      }

      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(
        (likeId) => String(likeId) === String(req.user._id)
      );
      postObj.likesCount = post.likes.length;
      delete postObj.likes;

      res.status(200).json({
        success: true,
        data: postObj,
      });
    } catch (error) {
      console.error("[Get Post By Id Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch post." });
    }
  }
}

module.exports = CommunityController;
