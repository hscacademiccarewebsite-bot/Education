"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import PageHero from "@/components/layouts/PageHero";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import {
  useAssignBatchesToStaffMutation,
  useListUsersQuery,
  useUpdateUserRoleMutation,
} from "@/lib/features/user/userApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { ROLES } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

export default function UsersPage() {
  const role = useSelector(selectCurrentUserRole);
  const [roleFilter, setRoleFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assignmentDraft, setAssignmentDraft] = useState({});

  const { data: usersData, isLoading } = useListUsersQuery(roleFilter ? { role: roleFilter } : {});
  const { data: batchesData } = useListBatchesQuery();
  const [updateUserRole, { isLoading: roleUpdating }] = useUpdateUserRoleMutation();
  const [assignBatchesToStaff, { isLoading: assigning }] = useAssignBatchesToStaffMutation();

  const users = usersData?.data || [];
  const batches = batchesData?.data || [];
  const roleOptions = useMemo(() => Object.values(ROLES), []);

  const getDraftBatchIds = (user) => {
    if (assignmentDraft[user._id]) {
      return assignmentDraft[user._id];
    }
    return (user.assignedBatches || []).map((id) => String(id));
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

    try {
      await updateUserRole({ userId, role: nextRole }).unwrap();
      setMessage("User role updated.");
    } catch (updateError) {
      setError(normalizeApiError(updateError, "Failed to update role."));
    }
  };

  const handleAssign = async (user) => {
    setMessage("");
    setError("");

    try {
      await assignBatchesToStaff({ userId: user._id, batchIds: getDraftBatchIds(user) }).unwrap();
      setMessage("Course assignments updated.");
    } catch (assignError) {
      setError(normalizeApiError(assignError, "Failed to assign batches."));
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Access Control"
          title="User and role administration."
          description="Manage account roles, staff course assignments, and operational access from one control surface."
          actions={<RoleBadge role={role} />}
          aside={
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                Directory Stats
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Users</p>
                  <p className="mt-2 text-3xl font-black text-white">{users.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Courses</p>
                  <p className="mt-2 text-3xl font-black text-white">{batches.length}</p>
                </div>
              </div>
            </div>
          }
        />

        <div className="site-panel mt-6 rounded-[30px] p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Filter by role
            </p>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
            >
              <option value="">All</option>
              {roleOptions.map((itemRole) => (
                <option key={itemRole} value={itemRole}>
                  {itemRole}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        <div className="mt-6">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <article key={user._id} className="site-panel rounded-[30px] p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-black text-slate-950">{user.fullName}</h3>
                      <p className="mt-2 text-sm text-slate-600">{user.email || "No email"}</p>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="site-grid mt-5 lg:grid-cols-[340px_minmax(0,1fr)]">
                    <div className="site-panel-muted rounded-[26px] p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Update Role
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <select
                          defaultValue={user.role}
                          onChange={(event) => handleRoleUpdate(user._id, event.target.value)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                        >
                          {roleOptions.map((itemRole) => (
                            <option key={itemRole} value={itemRole}>
                              {itemRole}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs font-semibold text-slate-500">
                          {roleUpdating ? "Updating..." : "Auto-save on change"}
                        </span>
                      </div>
                    </div>

                    <div className="site-panel-muted rounded-[26px] p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Assign Courses
                      </p>
                      {user.role === ROLES.TEACHER || user.role === ROLES.MODERATOR ? (
                        <>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {batches.map((batch) => {
                              const checked = getDraftBatchIds(user).includes(batch._id);
                              return (
                                <label
                                  key={batch._id}
                                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                    checked
                                      ? "border-teal-200 bg-teal-50 text-teal-700"
                                      : "border-slate-200 bg-white text-slate-600"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleBatchForUser(user, batch._id)}
                                  />
                                  <span>{batch.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            disabled={assigning}
                            onClick={() => handleAssign(user)}
                            className="site-button-primary mt-5 px-5 py-3 text-xs"
                          >
                            {assigning ? "Saving..." : "Save Assignment"}
                          </button>
                        </>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Change role to teacher or moderator to enable course assignment.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}

