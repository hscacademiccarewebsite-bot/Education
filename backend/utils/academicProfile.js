const mongoose = require("mongoose");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");

const ACADEMIC_BATCH_PREFIX = "HSC";
const ACADEMIC_BATCH_WINDOW = 2;

const normalizeAcademicBatchYear = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  if (parsed >= 2000 && parsed <= 2100) {
    return parsed;
  }

  if (parsed >= 0 && parsed <= 99) {
    return 2000 + parsed;
  }

  return null;
};

const buildAcademicBatchLabel = (year) => {
  const normalizedYear = normalizeAcademicBatchYear(year);
  if (!normalizedYear) {
    return "";
  }

  return `${ACADEMIC_BATCH_PREFIX} ${String(normalizedYear).slice(-2)}`;
};

const deriveAcademicStatus = ({ approvedEnrollmentCount = 0, isExStudent = false } = {}) => {
  if (isExStudent) {
    return "ex_student";
  }

  return Number(approvedEnrollmentCount || 0) > 0 ? "student" : "normal_user";
};

const getAcademicBatchOptions = (referenceDate = new Date(), windowSize = ACADEMIC_BATCH_WINDOW) => {
  const currentYear = referenceDate.getFullYear();
  const options = [];

  for (let year = currentYear - windowSize; year <= currentYear + windowSize; year += 1) {
    options.push({
      year,
      label: buildAcademicBatchLabel(year),
    });
  }

  return options;
};

const toPlainObject = (item) => {
  if (!item) {
    return item;
  }

  return typeof item.toObject === "function" ? item.toObject() : { ...item };
};

const getObjectIdString = (value) => {
  const candidate = value?._id || value;
  return candidate ? String(candidate) : "";
};

const buildApprovedEnrollmentCountMap = async (userIds = []) => {
  const uniqueUserIds = [...new Set((userIds || []).map((id) => String(id || "")).filter(Boolean))];
  const objectIds = uniqueUserIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    return new Map();
  }

  const rows = await EnrollmentRequest.aggregate([
    {
      $match: {
        student: { $in: objectIds },
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$student",
        count: { $sum: 1 },
      },
    },
  ]);

  return rows.reduce((acc, row) => {
    acc.set(String(row._id), Number(row.count || 0));
    return acc;
  }, new Map());
};

const applyAcademicProfile = (userLike, approvedEnrollmentCount = 0) => {
  if (!userLike) {
    return userLike;
  }

  const user = toPlainObject(userLike);
  const academicBatchYear = normalizeAcademicBatchYear(user.academicBatchYear);
  const academicBatchLabel = buildAcademicBatchLabel(academicBatchYear);

  user.academicBatchYear = academicBatchYear;
  user.academicBatchLabel = academicBatchLabel || String(user.academicBatchLabel || "").trim();
  user.isExStudent = Boolean(user.isExStudent);
  user.approvedEnrollmentCount = Number(approvedEnrollmentCount || 0);
  user.academicStatus = deriveAcademicStatus({
    approvedEnrollmentCount: user.approvedEnrollmentCount,
    isExStudent: user.isExStudent,
  });

  return user;
};

const enrichUsersWithAcademicProfile = async (users = []) => {
  const plainUsers = (users || []).filter(Boolean).map((user) => toPlainObject(user));
  const countMap = await buildApprovedEnrollmentCountMap(
    plainUsers.map((user) => getObjectIdString(user)).filter(Boolean)
  );

  return plainUsers.map((user) =>
    applyAcademicProfile(user, countMap.get(getObjectIdString(user)) || 0)
  );
};

const enrichUserWithAcademicProfile = async (user) => {
  if (!user) {
    return null;
  }

  const [enrichedUser] = await enrichUsersWithAcademicProfile([user]);
  return enrichedUser || null;
};

const enrichNestedUserField = async (items = [], fieldName) => {
  const plainItems = (items || []).map((item) => toPlainObject(item));
  const relatedUsers = plainItems
    .map((item) => item?.[fieldName])
    .filter(Boolean);
  const enrichedUsers = await enrichUsersWithAcademicProfile(relatedUsers);
  const enrichedUserMap = enrichedUsers.reduce((acc, user) => {
    acc.set(getObjectIdString(user), user);
    return acc;
  }, new Map());

  return plainItems.map((item) => {
    const fieldValue = item?.[fieldName];
    const fieldId = getObjectIdString(fieldValue);
    if (!fieldId || !enrichedUserMap.has(fieldId)) {
      return item;
    }

    return {
      ...item,
      [fieldName]: enrichedUserMap.get(fieldId),
    };
  });
};

module.exports = {
  ACADEMIC_BATCH_PREFIX,
  ACADEMIC_BATCH_WINDOW,
  normalizeAcademicBatchYear,
  buildAcademicBatchLabel,
  deriveAcademicStatus,
  getAcademicBatchOptions,
  applyAcademicProfile,
  enrichUserWithAcademicProfile,
  enrichUsersWithAcademicProfile,
  enrichNestedUserField,
};
