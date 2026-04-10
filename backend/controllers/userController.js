const User = require("../model/userSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const PaymentRecord = require("../model/paymentRecordSchema");
const CommunityPost = require("../model/communityPostSchema");
const { USER_ROLES } = require("../model/constants");
const { getAccessibleBatchIdsForStaff, isAdmin, isValidObjectId } = require("../utils/batchAccess");
const {
  normalizeCloudinaryAsset,
  deleteCloudinaryAssetByPublicId,
} = require("../utils/cloudinaryAsset");
const { sendWelcomeEmail } = require("../utils/email");
const {
  buildAcademicBatchLabel,
  enrichUserWithAcademicProfile,
  enrichUsersWithAcademicProfile,
  getAcademicBatchOptions,
} = require("../utils/academicProfile");

async function getStudentBatchIds(studentId) {
  const userEnrollments = await EnrollmentRequest.find({
    student: studentId,
    status: "approved",
  }).select("batch");

  return userEnrollments.map((item) => String(item.batch));
}

class UserController {
  static async registerUser(req, res) {
    try {
      const {
        firebaseUid: bodyFirebaseUid,
        email: bodyEmail,
        fullName: bodyFullName,
        phone,
        school,
        college,
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
        school,
        college,
        facebookProfileId,
        profilePhoto: normalizedProfilePhoto,
        role: "student",
      };

      const existingUser = await User.findOne({ firebaseUid });

      if (existingUser) {
        const existingName = String(existingUser.fullName || "").trim();
        const tokenDerivedNames = new Set(
          [tokenName, tokenEmail, bodyEmail, bodyEmail?.split("@")[0], tokenEmail?.split("@")[0], "Student User"]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        );

        existingUser.email = email ?? existingUser.email;
        // Preserve names changed from the profile page instead of overwriting them
        // on every auth sync with the Firebase token display name.
        if (!existingName || tokenDerivedNames.has(existingName)) {
          existingUser.fullName = fullName ?? existingUser.fullName;
        }
        existingUser.phone = phone ?? existingUser.phone;
        if (school !== undefined) {
          existingUser.school = String(school || "").trim();
        }
        if (college !== undefined) {
          existingUser.college = String(college || "").trim();
        }
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
          data: await enrichUserWithAcademicProfile(existingUser),
        });
      }

      const createdUser = await User.create({
        ...userPayload,
        lastLoginAt: new Date(),
      });

      // Send Welcome Email asynchronously
      if (createdUser.email) {
        sendWelcomeEmail(createdUser).catch(err => console.error("Welcome email failed:", err));
      }

      return res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: await enrichUserWithAcademicProfile(createdUser),
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
        data: await enrichUserWithAcademicProfile(req.user),
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
      const {
        fullName,
        phone,
        school,
        college,
        facebookProfileId,
        varsity,
        experience,
        profilePhoto,
        removeProfilePhoto,
      } = req.body;

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

      if (school !== undefined) {
        req.user.school = String(school || "").trim();
      }

      if (college !== undefined) {
        req.user.college = String(college || "").trim();
      }

      if (facebookProfileId !== undefined) {
        req.user.facebookProfileId = String(facebookProfileId || "").trim();
      }

      if (varsity !== undefined) {
        req.user.varsity = String(varsity || "").trim();
      }

      if (experience !== undefined) {
        req.user.experience = String(experience || "").trim();
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
        data: await enrichUserWithAcademicProfile(req.user),
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
      const { role, academicStatus, isActive, batchId } = req.query;
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

      // Academic status filter: normal_user, student, ex_student
      if (academicStatus) {
        const validStatuses = ["normal_user", "student", "ex_student"];
        if (!validStatuses.includes(academicStatus)) {
          return res.status(400).json({
            success: false,
            message: "Invalid academic status filter.",
          });
        }

        if (academicStatus === "ex_student") {
          query.isExStudent = true;
        } else if (academicStatus === "student") {
          // Students have approved enrollments and are not ex-students
          query.isExStudent = { $ne: true };
          // We'll filter by approvedEnrollmentCount after fetching
        } else {
          // normal_user: not a student (no approved enrollments)
          query.$or = [
            { isExStudent: { $ne: true } },
            { isExStudent: { $exists: false } },
          ];
        }
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

      let users = await User.find(query).sort({ createdAt: -1 }).lean();

      // Enrich with academic profile
      users = await enrichUsersWithAcademicProfile(users);

      // Post-filter for academic status if needed (student, normal_user)
      if (academicStatus === "student") {
        users = users.filter((u) => u.academicStatus === "student");
      } else if (academicStatus === "normal_user") {
        users = users.filter((u) => u.academicStatus === "normal_user");
      }

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
        { returnDocument: "after", runValidators: true }
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
        data: await enrichUserWithAcademicProfile(targetUser),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update role.",
        error: error.message,
      });
    }
  }

  static async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId.",
        });
      }

      const targetUser = await User.findById(userId)
        .populate("assignedBatches", "name slug status monthlyFee currency facebookGroupUrl startsAt endsAt")
        .lean();

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const requesterIsAdmin = isAdmin(req.user);
      const accessibleBatchIds = requesterIsAdmin
        ? []
        : await getAccessibleBatchIdsForStaff(req.user);
      const accessibleBatchIdSet = new Set(accessibleBatchIds.map((id) => String(id)));

      if (!requesterIsAdmin && accessibleBatchIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this user's course data.",
        });
      }

      const isStudentAccount = targetUser.role === "student";
      const enrollmentQuery = { student: userId };
      const paymentQuery = { student: userId };

      if (!requesterIsAdmin) {
        enrollmentQuery.batch = { $in: accessibleBatchIds };
        paymentQuery.batch = { $in: accessibleBatchIds };
      }

      const [enrollmentRequests, payments] = await Promise.all([
        EnrollmentRequest.find(enrollmentQuery)
          .populate("batch", "name slug status monthlyFee currency facebookGroupUrl startsAt endsAt")
          .populate("reviewedBy", "fullName role")
          .sort({ createdAt: -1 })
          .lean(),
        isStudentAccount
          ? PaymentRecord.find(paymentQuery)
              .populate(
                "batch",
                "name slug status monthlyFee currency facebookGroupUrl startsAt endsAt"
              )
              .populate("paidBy", "fullName role")
              .populate("enrollmentRequest", "status")
              .sort({ createdAt: -1 })
              .lean()
          : Promise.resolve([]),
      ]);

      if (!requesterIsAdmin) {
        targetUser.assignedBatches = (targetUser.assignedBatches || []).filter((batch) =>
          accessibleBatchIdSet.has(String(batch?._id || batch || ""))
        );

        const hasAccessibleData =
          targetUser.assignedBatches.length > 0 || enrollmentRequests.length > 0 || payments.length > 0;

        if (!hasAccessibleData) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this user's course data.",
          });
        }
      }

      const enrollmentSummary = enrollmentRequests.reduce(
        (acc, item) => {
          if (item.status === "pending") {
            acc.pending += 1;
          } else if (item.status === "approved") {
            acc.approved += 1;
          } else if (item.status === "rejected") {
            acc.rejected += 1;
          } else if (item.status === "kicked_out") {
            acc.kickedOut += 1;
          }
          return acc;
        },
        {
          total: enrollmentRequests.length,
          pending: 0,
          approved: 0,
          rejected: 0,
          kickedOut: 0,
        }
      );

      const paymentSummary = payments.reduce(
        (acc, item) => {
          const amount = Number(item.amount || 0);
          acc.totalAmount += amount;

          if (item.status === "due") {
            acc.totalDue += amount;
            acc.dueCount += 1;
          } else if (item.status === "paid_online" || item.status === "paid_offline") {
            acc.totalPaid += amount;
            acc.paidCount += 1;
          } else if (item.status === "waived") {
            acc.totalWaived += amount;
            acc.waivedCount += 1;
          }

          return acc;
        },
        {
          totalRecords: payments.length,
          totalAmount: 0,
          totalDue: 0,
          totalPaid: 0,
          totalWaived: 0,
          dueCount: 0,
          paidCount: 0,
          waivedCount: 0,
        }
      );

      const assignedBatchIds = new Set(
        (targetUser.assignedBatches || [])
          .map((batch) => String(batch?._id || batch || ""))
          .filter(Boolean)
      );

      const enrollmentBatchIds = new Set(
        enrollmentRequests.map((item) => String(item.batch?._id || item.batch || "")).filter(Boolean)
      );

      const paymentBatchIds = new Set(
        payments.map((item) => String(item.batch?._id || item.batch || "")).filter(Boolean)
      );

      const allRelatedBatchIds = new Set([
        ...assignedBatchIds,
        ...enrollmentBatchIds,
        ...paymentBatchIds,
      ]);

      const latestPaidRecord = payments.reduce((latest, item) => {
        if (!item.paidAt) {
          return latest;
        }

        const paidAt = new Date(item.paidAt);
        if (Number.isNaN(paidAt.getTime())) {
          return latest;
        }

        if (!latest) {
          return item;
        }

        const latestPaidAt = new Date(latest.paidAt);
        if (Number.isNaN(latestPaidAt.getTime()) || paidAt > latestPaidAt) {
          return item;
        }

        return latest;
      }, null);

      const enrichedTargetUser = await enrichUserWithAcademicProfile(targetUser);

      return res.status(200).json({
        success: true,
        data: {
          user: enrichedTargetUser,
          enrollmentRequests,
          payments,
          summary: {
            courses: {
              assignedCount: assignedBatchIds.size,
              enrollmentCourseCount: enrollmentBatchIds.size,
              paymentCourseCount: paymentBatchIds.size,
              totalRelatedCourses: allRelatedBatchIds.size,
            },
            enrollment: enrollmentSummary,
            payments: {
              enabled: isStudentAccount,
              ...paymentSummary,
              lastPaidAt: latestPaidRecord?.paidAt || null,
            },
            academic: {
              status: enrichedTargetUser?.academicStatus || "normal_user",
              batchLabel: enrichedTargetUser?.academicBatchLabel || "",
              batchYear: enrichedTargetUser?.academicBatchYear || null,
              approvedEnrollmentCount: Number(enrichedTargetUser?.approvedEnrollmentCount || 0),
              isExStudent: Boolean(enrichedTargetUser?.isExStudent),
            },
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load user details.",
        error: error.message,
      });
    }
  }

  static async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId.",
        });
      }

      const targetUser = await User.findById(userId)
        .select(
          "_id fullName profilePhoto role school college createdAt isActive academicBatchYear academicBatchLabel isExStudent"
        )
        .lean();

      if (!targetUser || !targetUser.isActive) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      let profilePostQuery = { author: targetUser._id };

      if (req.user.role === "student" && String(req.user._id) !== String(targetUser._id)) {
        const myBatchIds = await getStudentBatchIds(req.user._id);
        profilePostQuery = {
          author: targetUser._id,
          $or: [
            { privacy: "public" },
            {
              privacy: "enrolled_members",
              enrolledBatches: { $in: myBatchIds },
            },
          ],
        };
      }

      const accessiblePostsCount = await CommunityPost.countDocuments(profilePostQuery);

      return res.status(200).json({
        success: true,
        data: {
          user: await enrichUserWithAcademicProfile(targetUser),
          summary: {
            postsCount: accessiblePostsCount,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load public profile.",
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
        data: await enrichUserWithAcademicProfile(targetUser),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to assign batches.",
        error: error.message,
      });
    }
  }

  static async listAcademicBatches(req, res) {
    try {
      const users = await User.find({
        role: "student",
        isActive: true,
      })
        .select(
          "_id fullName email phone profilePhoto academicBatchYear academicBatchLabel isExStudent createdAt"
        )
        .sort({ academicBatchYear: -1, fullName: 1 })
        .lean();

      const enrichedUsers = await enrichUsersWithAcademicProfile(users);
      const grouped = enrichedUsers
        .filter(
          (user) =>
            user.academicStatus === "student" ||
            user.academicStatus === "ex_student"
        )
        .reduce((acc, user) => {
          const normalizedLabel =
            user.academicBatchLabel || buildAcademicBatchLabel(user.academicBatchYear) || "Unassigned";
          const groupKey = user.academicBatchYear ? String(user.academicBatchYear) : "unassigned";

          if (!acc.has(groupKey)) {
            acc.set(groupKey, {
              key: groupKey,
              batchYear: user.academicBatchYear || null,
              batchLabel: normalizedLabel,
              totalMembers: 0,
              studentCount: 0,
              exStudentCount: 0,
              members: [],
            });
          }

          const group = acc.get(groupKey);
          group.totalMembers += 1;
          if (user.academicStatus === "student") {
            group.studentCount += 1;
          }
          if (user.academicStatus === "ex_student") {
            group.exStudentCount += 1;
          }
          group.members.push(user);

          return acc;
        }, new Map());

      const items = [...grouped.values()]
        .map((group) => ({
          ...group,
          members: [...group.members].sort((a, b) =>
            String(a.fullName || "").localeCompare(String(b.fullName || ""))
          ),
        }))
        .sort((a, b) => {
          if (a.batchYear === null) return 1;
          if (b.batchYear === null) return -1;
          return b.batchYear - a.batchYear;
        });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
        meta: {
          academicBatchOptions: getAcademicBatchOptions(),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to load academic batch groups.",
        error: error.message,
      });
    }
  }

  static async updateGraduationStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isExStudent } = req.body;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId.",
        });
      }

      if (typeof isExStudent !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isExStudent must be a boolean.",
        });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (targetUser.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Only student accounts can be marked as ex-student.",
        });
      }

      targetUser.isExStudent = isExStudent;
      targetUser.graduatedAt = isExStudent ? new Date() : undefined;
      targetUser.graduatedBy = isExStudent ? req.user._id : undefined;
      targetUser.academicBatchLabel =
        buildAcademicBatchLabel(targetUser.academicBatchYear) || targetUser.academicBatchLabel || "";

      await targetUser.save();

      return res.status(200).json({
        success: true,
        message: isExStudent
          ? "Student marked as ex-student successfully."
          : "Ex-student status revoked successfully.",
        data: await enrichUserWithAcademicProfile(targetUser),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update graduation status.",
        error: error.message,
      });
    }
  }

  static async searchUsers(req, res) {
    try {
      const { q } = req.query;
      const trimmed = (q || "").trim();

      let users;
      if (!trimmed) {
        // Bare "@" — return 10 random active users
        users = await User.find({ isActive: true })
          .select(
            "_id fullName profilePhoto role academicBatchYear academicBatchLabel isExStudent"
          )
          .limit(10)
          .lean();
      } else {
        users = await User.find({
          fullName: { $regex: trimmed, $options: "i" },
          isActive: true,
        })
          .select(
            "_id fullName profilePhoto role academicBatchYear academicBatchLabel isExStudent"
          )
          .limit(10)
          .lean();
      }

      return res.status(200).json({
        success: true,
        data: await enrichUsersWithAcademicProfile(users),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to search users.",
        error: error.message,
      });
    }
  }

  static async updateBatchGraduationStatus(req, res) {
    try {
      const { batchYear } = req.params;
      const { isExStudent } = req.body;

      if (!batchYear || !/^\d{4}$/.test(batchYear)) {
        return res.status(400).json({
          success: false,
          message: "Valid batchYear (YYYY format) is required.",
        });
      }

      if (typeof isExStudent !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isExStudent must be a boolean.",
        });
      }

      const targetYear = parseInt(batchYear, 10);
      const batchLabel = buildAcademicBatchLabel(targetYear);

      // Find all students in this academic batch year who are currently active students
      const query = {
        role: "student",
        academicBatchYear: targetYear,
        isActive: true,
      };

      // If marking as graduated, only affect current students (not already ex-students)
      // If revoking graduation, only affect ex-students
      if (isExStudent) {
        query.isExStudent = { $ne: true };
      } else {
        query.isExStudent = true;
      }

      const studentsToUpdate = await User.find(query).select("_id fullName isExStudent");

      if (studentsToUpdate.length === 0) {
        return res.status(200).json({
          success: true,
          message: isExStudent
            ? "No active students found in this batch to graduate."
            : "No ex-students found in this batch to revoke graduation.",
          data: {
            batchYear: targetYear,
            batchLabel,
            updatedCount: 0,
            affectedStudents: [],
          },
        });
      }

      const studentIds = studentsToUpdate.map((s) => s._id);
      const now = new Date();

      // Bulk update all students in the batch
      const updateResult = await User.updateMany(
        { _id: { $in: studentIds } },
        {
          $set: {
            isExStudent: isExStudent,
            academicBatchLabel: batchLabel,
            graduatedAt: isExStudent ? now : undefined,
            graduatedBy: isExStudent ? req.user._id : undefined,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: isExStudent
          ? `${updateResult.modifiedCount} student(s) marked as graduated from ${batchLabel}.`
          : `${updateResult.modifiedCount} ex-student(s) restored to active status in ${batchLabel}.`,
        data: {
          batchYear: targetYear,
          batchLabel,
          updatedCount: updateResult.modifiedCount,
          isExStudent,
          affectedStudentIds: studentIds.map((id) => String(id)),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update batch graduation status.",
        error: error.message,
      });
    }
  }

}

module.exports = UserController;
