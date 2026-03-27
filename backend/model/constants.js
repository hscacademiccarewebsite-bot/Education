const USER_ROLES = ["admin", "teacher", "moderator", "student"];

const BATCH_STATUSES = ["upcoming", "active", "archived"];

const ENROLLMENT_STATUSES = ["pending", "approved", "rejected", "kicked_out"];

const PAYMENT_STATUSES = ["due", "paid_online", "paid_offline", "waived"];

const PAYMENT_METHODS = ["bkash", "offline", "manual_adjustment"];

module.exports = {
  USER_ROLES,
  BATCH_STATUSES,
  ENROLLMENT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
};
