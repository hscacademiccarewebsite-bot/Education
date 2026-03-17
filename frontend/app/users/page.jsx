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
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

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
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState("");
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


  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-8 md:py-10">
        <RevealSection noStagger>
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

        <RevealSection className="site-panel mt-6 overflow-hidden rounded-[clamp(8px,5%,12px)]">
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
            <RevealItem className="p-3 md:p-4">
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
                    const isRoleUpdating = roleUpdatingUserId === user._id;

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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    </tbody>
                  </table>
                </div>
              </div>
            </RevealItem>
          )}
        </RevealSection>

      </section>
      {popupNode}
    </RequireAuth>
  );
}
