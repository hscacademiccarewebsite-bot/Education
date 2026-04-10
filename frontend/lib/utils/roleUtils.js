export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  MODERATOR: "moderator",
  STUDENT: "student",
};

export const ACADEMIC_STATUSES = {
  NORMAL_USER: "normal_user",
  STUDENT: "student",
  EX_STUDENT: "ex_student",
};

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR];
export const CONTENT_MANAGER_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR];

export const isAdmin = (role) => role === ROLES.ADMIN;
export const isStudent = (role) => role === ROLES.STUDENT;
export const isStaff = (role) => STAFF_ROLES.includes(role);
export const canManageContent = (role) => CONTENT_MANAGER_ROLES.includes(role);

export const resolveAcademicStatus = (user) => {
  if (!user) {
    return ACADEMIC_STATUSES.NORMAL_USER;
  }

  if (user.academicStatus) {
    return user.academicStatus;
  }

  if (user.isExStudent) {
    return ACADEMIC_STATUSES.EX_STUDENT;
  }

  return Number(user.approvedEnrollmentCount || 0) > 0
    ? ACADEMIC_STATUSES.STUDENT
    : ACADEMIC_STATUSES.NORMAL_USER;
};

export const getAcademicStatusLabelMeta = (status) => {
  if (status === ACADEMIC_STATUSES.EX_STUDENT) {
    return {
      key: "roles.ex_student",
      defaultLabel: "Ex Student",
    };
  }

  if (status === ACADEMIC_STATUSES.STUDENT) {
    return {
      key: "roles.student",
      defaultLabel: "Student",
    };
  }

  return {
    key: "roles.normal_user",
    defaultLabel: "User",
  };
};

export const getUserDisplayRoleMeta = (user) => {
  if (isStaff(user?.role)) {
    return {
      key: `roles.${user.role}`,
      defaultLabel:
        user?.role === ROLES.ADMIN
          ? "Admin"
          : user?.role === ROLES.TEACHER
          ? "Teacher"
          : "Moderator",
    };
  }

  return getAcademicStatusLabelMeta(resolveAcademicStatus(user));
};

export const getUserDisplayRoleLabel = (user, t) => {
  const meta = getUserDisplayRoleMeta(user);
  return t ? t(meta.key, meta.defaultLabel) : meta.defaultLabel;
};

export const getVisibleAcademicTag = (user) => {
  if (isStaff(user?.role)) {
    return null;
  }

  const status = resolveAcademicStatus(user);
  return status === ACADEMIC_STATUSES.STUDENT || status === ACADEMIC_STATUSES.EX_STUDENT
    ? status
    : null;
};
