"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import {
  useAssignBatchesToStaffMutation,
  useListUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateGraduationStatusMutation,
} from "@/lib/features/user/userApi";
import { ROLES, ACADEMIC_STATUSES, getUserDisplayRoleLabel } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function UsersPage() {
  const [filterType, setFilterType] = useState(""); // Combined filter value
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();
  const { t, language } = useSiteLanguage();

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const usersSkip = !isInitialized || !isAuthenticated;

  // Parse filter type to determine if it's a role or academic status filter
  const queryParams = useMemo(() => {
    if (!filterType) return {};
    if (filterType.startsWith("role:")) {
      return { role: filterType.replace("role:", "") };
    }
    if (filterType.startsWith("academic:")) {
      return { academicStatus: filterType.replace("academic:", "") };
    }
    return {};
  }, [filterType]);

  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useListUsersQuery(queryParams, {
    skip: usersSkip,
  });
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [updateGraduationStatus] = useUpdateGraduationStatusMutation();

  const users = usersData?.data || [];
  const roleOptions = useMemo(() => Object.values(ROLES), []);

  // Combined filter options: roles + academic statuses
  const filterOptions = useMemo(() => [
    { type: "academic", value: ACADEMIC_STATUSES.NORMAL_USER, label: t("academicStatuses.normal_user", "User") },
    { type: "academic", value: ACADEMIC_STATUSES.STUDENT, label: t("academicStatuses.student", "Student (Active)") },
    { type: "academic", value: ACADEMIC_STATUSES.EX_STUDENT, label: t("academicStatuses.ex_student", "Ex-Student") },
    { type: "role", value: ROLES.STUDENT, label: t("roles.student", "Student (Role)") },
    { type: "role", value: ROLES.TEACHER, label: t("roles.teacher", "Teacher") },
    { type: "role", value: ROLES.MODERATOR, label: t("roles.moderator", "Moderator") },
    { type: "role", value: ROLES.ADMIN, label: t("roles.admin", "Admin") },
  ], [t]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = String(user.fullName || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [searchTerm, users]);


  const handleRoleUpdate = async (userId, nextRole, currentRole) => {
    setMessage("");
    setError("");
    setRoleUpdatingUserId(userId);

    try {
      // Handle ex-student promotion via graduation status endpoint
      if (nextRole === "ex_student") {
        await updateGraduationStatus({ userId, isExStudent: true }).unwrap();
        setMessage(t("usersPage.messages.markedExStudent", "User marked as ex-student"));
        showSuccess(t("usersPage.messages.markedExStudent", "User marked as ex-student"));
      } else if (nextRole === "user") {
        // User means normal user with student role but not ex-student
        if (currentRole !== "student") {
          await updateUserRole({ userId, role: "student" }).unwrap();
        }
        // Revoke ex-student status if they were one
        await updateGraduationStatus({ userId, isExStudent: false }).unwrap();
        setMessage(t("usersPage.messages.setToUser", "User set to normal user"));
        showSuccess(t("usersPage.messages.setToUser", "User set to normal user"));
      } else {
        // Regular role update
        await updateUserRole({ userId, role: nextRole }).unwrap();
        setMessage(t("usersPage.messages.roleUpdated"));
        showSuccess(t("usersPage.messages.roleUpdated"));
      }
    } catch (updateError) {
      const resolvedError = normalizeApiError(updateError, t("usersPage.messages.roleUpdateFailed"));
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setRoleUpdatingUserId("");
    }
  };


  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-8 md:py-10">
        <RevealSection noStagger>
          <div className="relative">
            <div className="flex flex-wrap items-end justify-between gap-6 px-4 md:px-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  {t("usersPage.kicker")}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  {t("usersPage.title", "User Management")}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-black tabular-nums text-slate-600 border border-slate-200">
                  {filteredUsers.length} {t("usersPage.usersCount")}
                </div>
                <button 
                  type="button" 
                  onClick={() => refetchUsers()} 
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-emerald-600 active:scale-90"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="relative group">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                  placeholder={t("usersPage.searchPlaceholder")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/60 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white/60 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">{t("usersPage.allTypes", "All Types")}</option>
                  <optgroup label={t("usersPage.academicStatusGroup", "Academic Status")}>
                    {filterOptions
                      .filter((opt) => opt.type === "academic")
                      .map((opt) => (
                        <option key={`academic:${opt.value}`} value={`academic:${opt.value}`}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label={t("usersPage.rolesGroup", "Roles")}>
                    {filterOptions
                      .filter((opt) => opt.type === "role")
                      .map((opt) => (
                        <option key={`role:${opt.value}`} value={`role:${opt.value}`}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <RevealSection className="mt-8">
          {isLoading ? (
            <div className="site-panel rounded-2xl p-8">
              <ListSkeleton rows={10} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="site-panel rounded-2xl py-24 text-center">
              <p className="text-xl font-black text-slate-900">{t("usersPage.emptyTitle")}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{t("usersPage.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f8fafc] border-b border-slate-200">
                    <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">{t("usersPage.table.user")}</th>
                      <th className="px-6 py-4">{t("usersPage.table.role")}</th>
                      <th className="px-6 py-4">{t("usersPage.table.promote", "Promote")}</th>
                      <th className="px-6 py-4">{t("usersPage.table.created", "Created")}</th>
                      <th className="px-6 py-4 text-center">{t("usersPage.table.actions", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isRoleUpdating = roleUpdatingUserId === user._id;

                      return (
                        <tr key={user._id} className="group transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <p className="text-[13px] font-black text-slate-900">{user.fullName || t("usersPage.unnamedUser")}</p>
                            <p className="text-[11px] font-bold text-slate-400">{user.email || t("usersPage.noEmail")}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full border border-slate-200 px-3 py-0.5 text-[10px] font-bold text-slate-600">
                              {getUserDisplayRoleLabel(user, t)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative max-w-[160px]">
                              <select
                                value={
                                  [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR].includes(user.role)
                                    ? user.role
                                    : user.academicStatus === "ex_student"
                                    ? "ex_student"
                                    : user.academicStatus === "student"
                                    ? "student"
                                    : user.academicStatus === "normal_user"
                                    ? "user"
                                    : user.role || "user"
                                }
                                onChange={(event) => handleRoleUpdate(user._id, event.target.value, user.role)}
                                disabled={isRoleUpdating}
                                className="h-9 w-full appearance-none rounded-lg border border-[#c1e6e5] bg-[#e0f7fa]/50 px-3 pr-8 text-[11px] font-black text-[#157f6d] outline-none transition-all hover:border-[#157f6d] hover:bg-[#e0f7fa] disabled:opacity-50"
                              >
                                <option value="user">{t("roles.user", "User")}</option>
                                <option value="student">{t("roles.student", "Student")}</option>
                                <option value="ex_student">{t("roles.ex_student", "Ex-Student")}</option>
                                <option value="teacher">{t("roles.teacher", "Teacher")}</option>
                                <option value="moderator">{t("roles.moderator", "Moderator")}</option>
                                <option value="admin">{t("roles.admin", "Admin")}</option>
                              </select>
                              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#157f6d]">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                              {isRoleUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#157f6d] border-t-transparent" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[12px] font-medium text-slate-500">
                              {new Date(user.createdAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link 
                              href={`/users/${user._id}/details`} 
                              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2 text-[11px] font-black text-white transition-all hover:bg-[#157f6d] active:scale-95"
                            >
                              {t("usersPage.details", "Details")}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </RevealSection>

      </section>
      {popupNode}
    </RequireAuth>
  );
}
