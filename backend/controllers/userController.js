const User = require("../model/userSchema");
const { USER_ROLES } = require("../model/constants");
const { isValidObjectId } = require("../utils/batchAccess");
const {
  normalizeCloudinaryAsset,
  deleteCloudinaryAssetByPublicId,
} = require("../utils/cloudinaryAsset");

class UserController {
  static async registerUser(req, res) {
    try {
      const {
        firebaseUid: bodyFirebaseUid,
        email: bodyEmail,
        fullName: bodyFullName,
        phone,
        facebookProfileId,
        profilePhoto,
      } = req.body;
      const tokenUid = req.firebaseToken?.uid;
      const tokenEmail = req.firebaseToken?.email;
      const tokenName = req.firebaseToken?.name;
      const tokenPhoto = req.firebaseToken?.picture;

      if (!tokenUid) {
        return res.status(401).json({
          success: false,
          message: "Firebase token is required.",
        });
      }

      if (bodyFirebaseUid && bodyFirebaseUid !== tokenUid) {
        return res.status(403).json({
          success: false,
          message: "firebaseUid mismatch with authenticated token.",
        });
      }

      const firebaseUid = tokenUid;
      const email = bodyEmail || tokenEmail;
      const fullName = bodyFullName || tokenName || tokenEmail || "Student User";
      const payloadProfilePhoto = normalizeCloudinaryAsset(profilePhoto);
      const tokenProfilePhoto = tokenPhoto ? { url: tokenPhoto, publicId: "" } : null;
      const normalizedProfilePhoto = payloadProfilePhoto || tokenProfilePhoto;

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: "fullName is required.",
        });
      }

      const userPayload = {
        firebaseUid,
        email,
        fullName,
        phone,
        facebookProfileId,
        profilePhoto: normalizedProfilePhoto,
        role: "student",
      };

      const existingUser = await User.findOne({ firebaseUid });

      if (existingUser) {
        existingUser.email = email ?? existingUser.email;
        existingUser.fullName = fullName ?? existingUser.fullName;
        existingUser.phone = phone ?? existingUser.phone;
        existingUser.facebookProfileId = facebookProfileId ?? existingUser.facebookProfileId;

        // Preserve custom uploaded avatars (with publicId) during auth sync.
        const hasExistingCustomPhoto = Boolean(existingUser?.profilePhoto?.publicId);
        const incomingHasCustomPhoto = Boolean(payloadProfilePhoto?.publicId);

        if (payloadProfilePhoto) {
          if (incomingHasCustomPhoto || !hasExistingCustomPhoto) {
            existingUser.profilePhoto = payloadProfilePhoto;
          }
        } else if (!hasExistingCustomPhoto && normalizedProfilePhoto) {
          existingUser.profilePhoto = normalizedProfilePhoto;
        }

        existingUser.lastLoginAt = new Date();
        await existingUser.save();

        return res.status(200).json({
          success: true,
          message: "User synced successfully.",
          data: existingUser,
        });
      }

      const createdUser = await User.create({
        ...userPayload,
        lastLoginAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: createdUser,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "User already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to register user.",
        error: error.message,
      });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get current user.",
        error: error.message,
      });
    }
  }

  static async updateCurrentUser(req, res) {
    try {
      const { fullName, phone, facebookProfileId, profilePhoto, removeProfilePhoto } = req.body;

      if (fullName !== undefined) {
        const normalizedName = String(fullName).trim();
        if (!normalizedName) {
          return res.status(400).json({
            success: false,
            message: "fullName cannot be empty.",
          });
        }
        req.user.fullName = normalizedName;
      }

      if (phone !== undefined) {
        req.user.phone = String(phone || "").trim();
      }

      if (facebookProfileId !== undefined) {
        req.user.facebookProfileId = String(facebookProfileId || "").trim();
      }

      const shouldRemoveProfilePhoto = Boolean(removeProfilePhoto);
      if (profilePhoto !== undefined || shouldRemoveProfilePhoto) {
        const previousPublicId = req.user?.profilePhoto?.publicId;

        if (shouldRemoveProfilePhoto) {
          req.user.profilePhoto = undefined;
          if (previousPublicId) {
            await deleteCloudinaryAssetByPublicId(previousPublicId);
          }
        } else {
          const normalizedAsset = normalizeCloudinaryAsset(profilePhoto);
          req.user.profilePhoto = normalizedAsset || undefined;

          const nextPublicId = normalizedAsset?.publicId;
          if (previousPublicId && previousPublicId !== nextPublicId) {
            await deleteCloudinaryAssetByPublicId(previousPublicId);
          }
        }
      }

      await req.user.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: req.user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update profile.",
        error: error.message,
      });
    }
  }

  static async listUsers(req, res) {
    try {
      const { role, isActive, batchId } = req.query;
      const query = {};

      if (role) {
        if (!USER_ROLES.includes(role)) {
          return res.status(400).json({
            success: false,
            message: "Invalid role filter.",
          });
        }

        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      if (batchId) {
        if (!isValidObjectId(batchId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid batchId.",
          });
        }

        query.assignedBatches = batchId;
      }

      const users = await User.find(query).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to list users.",
        error: error.message,
      });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId.",
        });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }

      const targetUser = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      );

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Role updated successfully.",
        data: targetUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update role.",
        error: error.message,
      });
    }
  }

  static async assignBatchesToStaff(req, res) {
    try {
      const { userId } = req.params;
      const { batchIds } = req.body;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId.",
        });
      }

      if (!Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "batchIds must be a non-empty array.",
        });
      }

      const invalidBatchId = batchIds.find((id) => !isValidObjectId(id));
      if (invalidBatchId) {
        return res.status(400).json({
          success: false,
          message: `Invalid batch id: ${invalidBatchId}`,
        });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!["teacher", "moderator"].includes(targetUser.role)) {
        return res.status(400).json({
          success: false,
          message: "Only teacher or moderator can be assigned to batches.",
        });
      }

      targetUser.assignedBatches = batchIds;
      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: "Batch assignments updated successfully.",
        data: targetUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to assign batches.",
        error: error.message,
      });
    }
  }

}

module.exports = UserController;
