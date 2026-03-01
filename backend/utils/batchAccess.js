const mongoose = require("mongoose");
const Batch = require("../model/batchSchema");

const STAFF_ROLES = new Set(["teacher", "moderator"]);

const toIdString = (idLike) => String(idLike);

const idListToSet = (items = []) =>
  new Set(items.filter(Boolean).map((item) => toIdString(item)));

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isAdmin = (user) => user?.role === "admin";
const isStaff = (user) => STAFF_ROLES.has(user?.role);

const userHasAssignedBatch = (user, batchId) => {
  const assigned = idListToSet(user?.assignedBatches || []);
  return assigned.has(toIdString(batchId));
};

const userListedInBatchStaff = (user, batchDoc) => {
  const userId = toIdString(user?._id);
  const teacherIds = idListToSet(batchDoc?.teachers || []);
  const moderatorIds = idListToSet(batchDoc?.moderators || []);
  return teacherIds.has(userId) || moderatorIds.has(userId);
};

const getBatchLite = async (batchId) =>
  Batch.findById(batchId).select("_id teachers moderators");

const canAccessBatch = async (user, batchId) => {
  if (!user || !batchId || !isValidObjectId(batchId)) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isStaff(user)) {
    return false;
  }

  if (userHasAssignedBatch(user, batchId)) {
    return true;
  }

  const batch = await getBatchLite(batchId);
  if (!batch) {
    return false;
  }

  return userListedInBatchStaff(user, batch);
};

const getAccessibleBatchIdsForStaff = async (user) => {
  if (!user || !isStaff(user)) {
    return [];
  }

  const set = idListToSet(user.assignedBatches || []);
  const batches = await Batch.find({
    $or: [{ teachers: user._id }, { moderators: user._id }],
  }).select("_id");

  for (const item of batches) {
    set.add(toIdString(item._id));
  }

  return Array.from(set)
    .filter((id) => isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

module.exports = {
  canAccessBatch,
  getAccessibleBatchIdsForStaff,
  isAdmin,
  isStaff,
  isValidObjectId,
};
