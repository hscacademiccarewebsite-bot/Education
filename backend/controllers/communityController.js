const CommunityPost = require("../model/communityPostSchema");
const CommunityComment = require("../model/communityCommentSchema");
const Notification = require("../model/notificationSchema");
const User = require("../model/userSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const { deleteCloudinaryAssetByPublicId } = require("../utils/cloudinaryAsset");
const { enrichNestedUserField } = require("../utils/academicProfile");

const EVERYONE_MENTION_ID = "everyone";
const COMMUNITY_AUTHOR_SELECT =
  "fullName profilePhoto role academicBatchYear academicBatchLabel isExStudent";

// Helper to get batch IDs a student is approved for
async function getStudentBatchIds(studentId) {
  const userEnrollments = await EnrollmentRequest.find({
    student: studentId,
    status: "approved",
  }).select("batch");
  return userEnrollments.map((e) => String(e.batch));
}

function extractMentionMeta(content, currentUserId) {
  const mentionRegex = /@\[(everyone|[a-f\d]{24})\]\(([^)]+)\)/g;
  const mentionIds = new Set();
  let hasEveryoneMention = /(^|[\s\u00A0])@everyone\b/i.test(String(content || ""));
  let match;

  while ((match = mentionRegex.exec(String(content || ""))) !== null) {
    const mentionedUserId = String(match[1] || "");
    if (mentionedUserId === EVERYONE_MENTION_ID) {
      hasEveryoneMention = true;
      continue;
    }

    if (String(mentionedUserId) !== String(currentUserId)) {
      mentionIds.add(mentionedUserId);
    }
  }

  return {
    mentionedUserIds: [...mentionIds],
    hasEveryoneMention,
  };
}

async function getAudienceUserIdsForPost(post, currentUserId) {
  const audienceIds = new Set();

  if (!post) return audienceIds;

  if (post.privacy === "enrolled_members" && Array.isArray(post.enrolledBatches) && post.enrolledBatches.length > 0) {
    const [staffIds, studentIds] = await Promise.all([
      User.distinct("_id", { isActive: true, role: { $ne: "student" } }),
      EnrollmentRequest.distinct("student", {
        status: "approved",
        batch: { $in: post.enrolledBatches },
      }),
    ]);

    staffIds.forEach((id) => audienceIds.add(String(id)));
    studentIds.forEach((id) => audienceIds.add(String(id)));
    audienceIds.add(String(post.author));
  } else {
    const activeUserIds = await User.distinct("_id", { isActive: true });
    activeUserIds.forEach((id) => audienceIds.add(String(id)));
  }

  audienceIds.delete(String(currentUserId));
  return audienceIds;
}

async function resolveMentionRecipientIds({ mentionedUserIds = [], hasEveryoneMention = false, currentUserId, post }) {
  const uniqueMentionIds = [...new Set((mentionedUserIds || []).map((id) => String(id)).filter(Boolean))];

  if (!post) {
    return uniqueMentionIds.filter((id) => String(id) !== String(currentUserId));
  }

  if (post.privacy === "enrolled_members" || hasEveryoneMention) {
    const allowedAudienceIds = await getAudienceUserIdsForPost(post, currentUserId);
    const recipientIds = new Set();

    uniqueMentionIds.forEach((id) => {
      if (allowedAudienceIds.has(String(id))) {
        recipientIds.add(String(id));
      }
    });

    if (hasEveryoneMention) {
      allowedAudienceIds.forEach((id) => recipientIds.add(String(id)));
    }

    return [...recipientIds];
  }

  return uniqueMentionIds.filter((id) => String(id) !== String(currentUserId));
}

async function createMentionNotifications({
  recipientIds,
  actor,
  postId,
  commentId = null,
  source = "post",
  everyoneMentioned = false,
}) {
  if (!recipientIds.length) return;

  const link = commentId ? `/community/posts/${postId}?commentId=${commentId}` : `/community/posts/${postId}`;
  const message = everyoneMentioned
    ? `${actor.fullName} mentioned everyone in a ${source}.`
    : `${actor.fullName} mentioned you in a ${source}.`;

  await Notification.insertMany(
    recipientIds.map((recipientId) => ({
      recipient: recipientId,
      title: "New Mention",
      message,
      type: "new_mention",
      link,
      metadata: commentId ? { postId, commentId } : { postId },
    }))
  );
}

class CommunityController {
  // Create a new post
  static async createPost(req, res) {
    try {
      const { content, images, privacy, enrolledBatches } = req.body;
      const normalizedPrivacy = privacy || "public";
      const targetBatches = normalizedPrivacy === "enrolled_members" ? (enrolledBatches || []) : [];
      const mentionMeta = extractMentionMeta(content, req.user._id);

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Post content or image is required.",
        });
      }

      if (normalizedPrivacy === "enrolled_members" && targetBatches.length === 0) {
        return res.status(400).json({
          success: false,
          message: "You must select at least one course when sharing with Enrolled Members.",
        });
      }

      const mentionRecipientIds = await resolveMentionRecipientIds({
        mentionedUserIds: mentionMeta.mentionedUserIds,
        hasEveryoneMention: mentionMeta.hasEveryoneMention,
        currentUserId: req.user._id,
        post: {
          author: req.user._id,
          privacy: normalizedPrivacy,
          enrolledBatches: targetBatches,
        },
      });

      const post = await CommunityPost.create({
        author: req.user._id,
        content,
        privacy: normalizedPrivacy,
        enrolledBatches: targetBatches,
        images: images || [],
        mentions: mentionMeta.mentionedUserIds,
      });

      await createMentionNotifications({
        recipientIds: mentionRecipientIds,
        actor: req.user,
        postId: post._id,
        source: "post",
        everyoneMentioned: mentionMeta.hasEveryoneMention,
      });

      const populatedPost = await post.populate("author", COMMUNITY_AUTHOR_SELECT);
      const [enrichedPost] = await enrichNestedUserField([populatedPost], "author");

      res.status(201).json({
        success: true,
        message: "Post created successfully.",
        data: enrichedPost,
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

      // Filter by author if requested
      if (req.query.author) {
        const targetAuthor = req.query.author === "me" ? req.user._id : req.query.author;
        query.author = targetAuthor;
      }

      if (req.user.role === "student") {
        const myBatchIds = await getStudentBatchIds(req.user._id);
        const privacyQuery = {
          $or: [
            { privacy: "public" },
            { author: req.user._id },
            {
              privacy: "enrolled_members",
              enrolledBatches: { $in: myBatchIds }
            }
          ]
        };

        if (query.author) {
          // If filtering by author, we still need to respect privacy if they are looking at someone else's posts
          // But if they are looking at "me", privacy is guaranteed by 'author: req.user._id'
          query = {
            $and: [
              { author: query.author },
              privacyQuery
            ]
          };
        } else {
          query = privacyQuery;
        }
      }

      const posts = await CommunityPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", COMMUNITY_AUTHOR_SELECT);

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
      const enrichedPosts = await enrichNestedUserField(postsWithLikeStatus, "author");

      res.status(200).json({
        success: true,
        data: enrichedPosts,
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

      const previousMentionIds = new Set((post.mentions || []).map((id) => String(id)));
      const previousMentionMeta = extractMentionMeta(post.content, userId);
      const nextContent = content !== undefined ? content : post.content;
      const nextMentionMeta = extractMentionMeta(nextContent, userId);

      post.content = nextContent;
      post.mentions = nextMentionMeta.mentionedUserIds;
      if (images) {
        // Find images that were removed
        const oldImages = post.images || [];
        const newImages = images || [];

        const removedImages = oldImages.filter(oldImg =>
          !newImages.some(newImg => newImg.publicId === oldImg.publicId)
        );

        for (const img of removedImages) {
          if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
        }

        post.images = images;
      }

      await post.save();

      const everyoneMentionAdded = nextMentionMeta.hasEveryoneMention && !previousMentionMeta.hasEveryoneMention;
      const newlyMentionedUserIds = everyoneMentionAdded
        ? nextMentionMeta.mentionedUserIds
        : nextMentionMeta.mentionedUserIds.filter((mentionId) => !previousMentionIds.has(String(mentionId)));

      if (everyoneMentionAdded || newlyMentionedUserIds.length > 0) {
        const mentionRecipientIds = await resolveMentionRecipientIds({
          mentionedUserIds: newlyMentionedUserIds,
          hasEveryoneMention: everyoneMentionAdded,
          currentUserId: userId,
          post,
        });

        await createMentionNotifications({
          recipientIds: mentionRecipientIds,
          actor: req.user,
          postId: post._id,
          source: "post",
          everyoneMentioned: everyoneMentionAdded,
        });
      }

      res.status(200).json({
        success: true,
        message: "Post updated successfully.",
        data: (
          await enrichNestedUserField(
            [await post.populate("author", COMMUNITY_AUTHOR_SELECT)],
            "author"
          )
        )[0],
      });
    } catch (error) {
      console.error("[Edit Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to update post." });
    }
  }

  // Helper for cascading deletion of a post and its associated data
  static async _performPostCleanup(post) {
    const postId = post._id;

    // 1. Delete associated images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
      }
    }

    // 2. Fetch all comments to delete their images and notifications
    const comments = await CommunityComment.find({ post: postId });
    for (const comment of comments) {
      if (comment.images && comment.images.length > 0) {
        for (const img of comment.images) {
          if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
        }
      }
    }

    // 3. Delete all comments associated with this post
    await CommunityComment.deleteMany({ post: postId });

    // 4. Delete all notifications associated with this post or its comments
    await Notification.deleteMany({
      $or: [
        { "metadata.postId": postId },
        { link: { $regex: new RegExp(`/community/posts/${postId}`) } }
      ]
    });

    // 5. Finally delete the post document
    await CommunityPost.findByIdAndDelete(postId);
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

      // Use the cleanup helper for cascading delete
      await CommunityController._performPostCleanup(post);

      res.status(200).json({
        success: true,
        message: "Post and all associated data deleted successfully.",
      });
    } catch (error) {
      console.error("[Delete Post Error]:", error);
      res.status(500).json({ success: false, message: "Failed to delete post." });
    }
  }

  // Automatically cleanup posts that have reached their expiration date (Scheduled Task)
  static async cleanupExpiredPosts() {
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      // Find posts where createdAt is older than 2 years
      const expiredPosts = await CommunityPost.find({ createdAt: { $lt: twoYearsAgo } });
      
      if (expiredPosts.length === 0) {
        return { success: true, count: 0 };
      }

      console.log(`[Scheduled Cleanup]: Deleting ${expiredPosts.length} expired posts.`);

      for (const post of expiredPosts) {
        await CommunityController._performPostCleanup(post);
      }

      return { success: true, count: expiredPosts.length };
    } catch (error) {
      console.error("[Scheduled Cleanup Error]:", error);
      throw error;
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

      const populatedComment = await comment.populate("author", COMMUNITY_AUTHOR_SELECT);
      const [enrichedComment] = await enrichNestedUserField([populatedComment], "author");

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

      const mentionMeta = extractMentionMeta(content, req.user._id);
      const mentionRecipientIds = await resolveMentionRecipientIds({
        mentionedUserIds: mentionMeta.mentionedUserIds,
        hasEveryoneMention: mentionMeta.hasEveryoneMention,
        currentUserId: req.user._id,
        post,
      });

      await createMentionNotifications({
        recipientIds: mentionRecipientIds,
        actor: req.user,
        postId,
        commentId: comment._id,
        source: "comment",
        everyoneMentioned: mentionMeta.hasEveryoneMention,
      });

      res.status(201).json({
        success: true,
        message: "Comment added successfully.",
        data: enrichedComment,
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
        .populate("author", COMMUNITY_AUTHOR_SELECT);

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
      const enrichedComments = await enrichNestedUserField(commentsWithStatus, "author");

      res.status(200).json({
        success: true,
        data: enrichedComments,
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

      const previousMentionMeta = extractMentionMeta(comment.content, userId);
      const nextContent = content !== undefined ? content : comment.content;

      comment.content = nextContent;
      if (images) {
        // Find images that were removed
        const oldImages = comment.images || [];
        const newImages = images || [];

        const removedImages = oldImages.filter(oldImg =>
          !newImages.some(newImg => newImg.publicId === oldImg.publicId)
        );

        for (const img of removedImages) {
          if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
        }

        comment.images = images;
      }

      await comment.save();

      const nextMentionMeta = extractMentionMeta(nextContent, userId);
      const everyoneMentionAdded = nextMentionMeta.hasEveryoneMention && !previousMentionMeta.hasEveryoneMention;
      const previousMentionIds = new Set(previousMentionMeta.mentionedUserIds.map((id) => String(id)));
      const newlyMentionedUserIds = everyoneMentionAdded
        ? nextMentionMeta.mentionedUserIds
        : nextMentionMeta.mentionedUserIds.filter((mentionId) => !previousMentionIds.has(String(mentionId)));

      if (everyoneMentionAdded || newlyMentionedUserIds.length > 0) {
        const post = await CommunityPost.findById(comment.post).select("author privacy enrolledBatches");
        const mentionRecipientIds = await resolveMentionRecipientIds({
          mentionedUserIds: newlyMentionedUserIds,
          hasEveryoneMention: everyoneMentionAdded,
          currentUserId: userId,
          post,
        });

        await createMentionNotifications({
          recipientIds: mentionRecipientIds,
          actor: req.user,
          postId: comment.post,
          commentId: comment._id,
          source: "comment",
          everyoneMentioned: everyoneMentionAdded,
        });
      }

      res.status(200).json({
        success: true,
        message: "Comment updated successfully.",
        data: (
          await enrichNestedUserField(
            [await comment.populate("author", COMMUNITY_AUTHOR_SELECT)],
            "author"
          )
        )[0],
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

      // 1. Delete associated images from Cloudinary
      if (comment.images && comment.images.length > 0) {
        for (const img of comment.images) {
          if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
        }
      }

      // 2. Handle replies (and their images/notifications)
      const replies = await CommunityComment.find({ parentId: commentId });
      for (const reply of replies) {
        if (reply.images && reply.images.length > 0) {
          for (const img of reply.images) {
            if (img.publicId) await deleteCloudinaryAssetByPublicId(img.publicId);
          }
        }
        // Delete notifications for replies
        await Notification.deleteMany({ "metadata.commentId": reply._id });
      }

      // 3. Delete replies from DB
      await CommunityComment.deleteMany({ parentId: commentId });

      // 4. Delete notifications for this comment
      await Notification.deleteMany({ "metadata.commentId": commentId });

      // 5. Delete the comment itself
      await CommunityComment.findByIdAndDelete(commentId);

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
      const post = await CommunityPost.findById(postId).populate("author", COMMUNITY_AUTHOR_SELECT);

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
      const [enrichedPost] = await enrichNestedUserField([postObj], "author");

      res.status(200).json({
        success: true,
        data: enrichedPost,
      });
    } catch (error) {
      console.error("[Get Post By Id Error]:", error);
      res.status(500).json({ success: false, message: "Failed to fetch post." });
    }
  }
}

module.exports = CommunityController;
