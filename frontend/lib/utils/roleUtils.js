export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  MODERATOR: "moderator",
  STUDENT: "student",
};

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR];
export const CONTENT_MANAGER_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR];

export const isAdmin = (role) => role === ROLES.ADMIN;
export const isStudent = (role) => role === ROLES.STUDENT;
export const isStaff = (role) => STAFF_ROLES.includes(role);
export const canManageContent = (role) => CONTENT_MANAGER_ROLES.includes(role);
