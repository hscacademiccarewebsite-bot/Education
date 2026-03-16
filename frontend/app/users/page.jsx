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
} from "@/lib/features/user/userApi";
import { ROLES } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function toIdList(list) {
  return (list || []).map((item) => String(item));
}

function areIdListsEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, index) => item === sortedB[index]);
}

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assignmentDraft, setAssignmentDraft] = useState({});
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState("");
  const [assigningUserId, setAssigningUserId] = useState("");
  const [activeAssignmentUserId, setActiveAssignmentUserId] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();
  const { t } = useSiteLanguage();

  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const usersSkip = !isInitialized || !isAuthenticated;

  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useListUsersQuery(roleFilter ? { role: roleFilter } : {}, {
    skip: usersSkip,
  });
  const { data: batchesData } = useListBatchesQuery(undefined, {
    skip: usersSkip,
  });
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [assignBatchesToStaff] = useAssignBatchesToStaffMutation();

  const users = usersData?.data || [];
  const batches = batchesData?.data || [];
  const roleOptions = useMemo(() => Object.values(ROLES), []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = String(user.fullName || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [searchTerm, users]);

  const activeAssignmentUser = useMemo(
    () => users.find((user) => user._id === activeAssignmentUserId) || null,
    [activeAssignmentUserId, users]
  );

  const filteredBatches = useMemo(() => {
    const query = courseSearchTerm.trim().toLowerCase();
    if (!query) return batches;
    return batches.filter((batch) => String(batch.name || "").toLowerCase().includes(query));
  }, [batches, courseSearchTerm]);

  useEffect(() => {
    if (!activeAssignmentUserId) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !assigningUserId) {
        setActiveAssignmentUserId("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeAssignmentUserId, assigningUserId]);

  const openAssignmentModal = (userId) => {
    setCourseSearchTerm("");
    setActiveAssignmentUserId(userId);
  };

  const closeAssignmentModal = () => {
    if (!assigningUserId) {
      setActiveAssignmentUserId("");
    }
  };

  const getOriginalBatchIds = (user) => toIdList(user.assignedBatches);

  const getDraftBatchIds = (user) => {
    if (assignmentDraft[user._id]) return assignmentDraft[user._id];
    return getOriginalBatchIds(user);
  };

  const hasAssignmentChanges = (user) => {
    if (!assignmentDraft[user._id]) return false;
    return !areIdListsEqual(getDraftBatchIds(user), getOriginalBatchIds(user));
  };

  const resetDraftForUser = (userId) => {
    setAssignmentDraft((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const toggleBatchForUser = (user, batchId) => {
    const current = getDraftBatchIds(user);
    const next = current.includes(batchId)
      ? current.filter((id) => id !== batchId)
      : [...current, batchId];
    setAssignmentDraft((prev) => ({ ...prev, [user._id]: next }));
  };

  const handleRoleUpdate = async (userId, nextRole) => {
    setMessage("");
    setError("");
    setRoleUpdatingUserId(userId);

    try {
      await updateUserRole({ userId, role: nextRole }).unwrap();
      setMessage(t("usersPage.messages.roleUpdated"));
      showSuccess(t("usersPage.messages.roleUpdated"));
    } catch (updateError) {
      const resolvedError = normalizeApiError(updateError, t("usersPage.messages.roleUpdateFailed"));
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setRoleUpdatingUserId("");
    }
  };

  const handleAssign = async (user) => {
    setMessage("");
    setError("");
    setAssigningUserId(user._id);

    try {
      await assignBatchesToStaff({ userId: user._id, batchIds: getDraftBatchIds(user) }).unwrap();
      setMessage(t("usersPage.messages.assignmentsUpdated"));
      showSuccess(t("usersPage.messages.assignmentsUpdated"));
      resetDraftForUser(user._id);
      setActiveAssignmentUserId("");
    } catch (assignError) {
      const resolvedError = normalizeApiError(assignError, t("usersPage.messages.assignFailed"));
      setError(resolvedError);
      showError(resolvedError);
    } finally {
      setAssigningUserId("");
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-8 md:py-10">
        <section className="site-panel rounded-[clamp(8px,5%,12px)] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="site-kicker">{t("usersPage.kicker")}</p>
              <h1 className="site-title mt-4">
                <span className="text-emerald-600">Users</span> Management
              </h1>
              <p className="site-lead mt-3 max-w-3xl">
                {t("usersPage.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => refetchUsers()} className="site-button-secondary">
                {t("usersPage.refresh")}
              </button>
              <Link href="/dashboard" className="site-button-primary">
                {t("navbar.dashboard")}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_130px]">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {t("usersPage.searchUsers")}
              </label>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("usersPage.searchPlaceholder")}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[var(--action-start)] focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {t("usersPage.roleFilter")}
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[var(--action-start)] focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">{t("usersPage.allRoles")}</option>
                {roleOptions.map((itemRole) => (
                  <option key={itemRole} value={itemRole}>
                    {t(`roles.${itemRole}`, itemRole)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">
                {filteredUsers.length} {t("usersPage.usersCount")}
              </p>
            </div>
          </div>
        </section>

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

        <section className="site-panel mt-6 overflow-hidden rounded-[clamp(8px,5%,12px)]">
          {isLoading ? (
            <div className="p-5 md:p-6">
              <ListSkeleton rows={8} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-5 py-12 text-center md:px-6">
              <p className="text-lg font-extrabold text-slate-900">{t("usersPage.emptyTitle")}</p>
              <p className="mt-2 text-sm text-slate-600">{t("usersPage.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="p-3 md:p-4">
              <div className="overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="max-h-[70vh] overflow-auto">
                  <table className="min-w-[1060px] w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        <th className="border border-slate-200 px-4 py-3 md:px-6">{t("usersPage.table.user")}</th>
                        <th className="border border-slate-200 px-4 py-3 md:px-6">{t("usersPage.table.email")}</th>
                        <th className="border border-slate-200 px-4 py-3 md:px-6">{t("usersPage.table.role")}</th>
                        <th className="border border-slate-200 px-4 py-3 md:px-6">{t("usersPage.table.status")}</th>
                        <th className="border border-slate-200 px-4 py-3 md:px-6">{t("usersPage.table.operations")}</th>
                      </tr>
                    </thead>
                    <tbody>
                  {filteredUsers.map((user) => {
                    const assignableRole = user.role === ROLES.TEACHER || user.role === ROLES.MODERATOR;
                    const isRoleUpdating = roleUpdatingUserId === user._id;
                    const assignedCount = getDraftBatchIds(user).length;

                    return (
                      <tr key={user._id} className="align-top bg-white transition-colors hover:bg-slate-50/60">
                        <td className="border border-slate-200 px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold text-white">
                              {initialsFromName(user.fullName) || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-900">{user.fullName || t("usersPage.unnamedUser")}</p>
                              {user.phone ? <p className="truncate text-xs text-slate-500">{user.phone}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-4 py-4 md:px-6">
                          <p className="max-w-[260px] break-all text-sm text-slate-700">{user.email || t("usersPage.noEmail")}</p>
                        </td>
                        <td className="border border-slate-200 px-4 py-4 md:px-6">
                          <select
                            value={user.role}
                            onChange={(event) => handleRoleUpdate(user._id, event.target.value)}
                            disabled={isRoleUpdating}
                            className="h-10 min-w-[150px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[var(--action-start)] focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                          >
                            {roleOptions.map((itemRole) => (
                              <option key={itemRole} value={itemRole}>
                                {t(`roles.${itemRole}`, itemRole)}
                              </option>
                            ))}
                          </select>
                          {isRoleUpdating ? (
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">{t("usersPage.updatingRole")}</p>
                          ) : null}
                        </td>
                        <td className="border border-slate-200 px-4 py-4 md:px-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <RoleBadge role={user.role} />
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                                user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {user.isActive ? t("usersPage.active") : t("usersPage.inactive")}
                            </span>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-4 py-4 md:px-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/users/${user._id}`} className="site-button-primary min-w-[124px] justify-center">
                              {t("usersPage.seeDetails")}
                            </Link>
                            <button
                              type="button"
                              disabled={!assignableRole}
                              onClick={() => openAssignmentModal(user._id)}
                              className="site-button-secondary min-w-[164px] justify-center disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {assignableRole ? `${t("usersPage.assign")} (${assignedCount})` : t("usersPage.notAssignable")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {activeAssignmentUser ? (
          <div
            className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:p-6"
            onClick={closeAssignmentModal}
          >
            <aside
              className="site-panel animate-scale-in max-h-[90vh] w-full max-w-[820px] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 p-5 md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="site-kicker">{t("usersPage.courseAssignment")}</p>
                  <h2 className="mt-3 text-lg font-extrabold text-slate-950 md:text-xl">
                    {activeAssignmentUser.fullName || t("usersPage.unnamedUser")}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("usersPage.assignmentHelp")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(assigningUserId)}
                  onClick={closeAssignmentModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                  aria-label={t("usersPage.closePopup")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {t("usersPage.searchCourses")}
                  </label>
                  <input
                    type="search"
                    value={courseSearchTerm}
                    onChange={(event) => setCourseSearchTerm(event.target.value)}
                    placeholder={t("usersPage.searchCoursePlaceholder")}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[var(--action-start)] focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex items-end">
                  <p className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">
                    {getDraftBatchIds(activeAssignmentUser).length} {t("usersPage.selected")}
                  </p>
                </div>
              </div>

              <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 p-3">
                {filteredBatches.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-600">{t("usersPage.noCoursesMatch")}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredBatches.map((batch) => {
                      const checked = getDraftBatchIds(activeAssignmentUser).includes(batch._id);
                      return (
                        <label
                          key={batch._id}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? "border-teal-200 bg-teal-50 text-teal-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBatchForUser(activeAssignmentUser, batch._id)}
                          />
                          <span className="truncate">{batch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  disabled={assigningUserId === activeAssignmentUser._id || !hasAssignmentChanges(activeAssignmentUser)}
                  onClick={() => handleAssign(activeAssignmentUser)}
                  className="site-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assigningUserId === activeAssignmentUser._id ? t("usersPage.saving") : t("usersPage.saveAssignment")}
                </button>
                <button
                  type="button"
                  disabled={assigningUserId === activeAssignmentUser._id || !assignmentDraft[activeAssignmentUser._id]}
                  onClick={() => resetDraftForUser(activeAssignmentUser._id)}
                  className="site-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("usersPage.resetSelection")}
                </button>
                {!hasAssignmentChanges(activeAssignmentUser) ? (
                  <p className="text-xs font-semibold text-slate-500">{t("usersPage.noPendingChanges")}</p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </section>
      {popupNode}
    </RequireAuth>
  );
}
