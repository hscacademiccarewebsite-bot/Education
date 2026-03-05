"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { useAssignBatchesToStaffMutation, useListUsersQuery, useUpdateUserRoleMutation } from "@/lib/features/user/userApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { ROLES } from "@/lib/utils/roleUtils";

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
      setError(updateError?.data?.message || "Failed to update role.");
    }
  };

  const handleAssign = async (user) => {
    setMessage("");
    setError("");

    try {
      const batchIds = getDraftBatchIds(user);
      await assignBatchesToStaff({ userId: user._id, batchIds }).unwrap();
      setMessage("Course assignments updated.");
    } catch (assignError) {
      setError(assignError?.data?.message || "Failed to assign batches.");
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Admin</p>
            <h1 className="text-2xl font-extrabold text-slate-900">User & Role Management</h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-semibold text-slate-700">Filter by role:</label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {roleOptions.map((itemRole) => (
              <option key={itemRole} value={itemRole}>
                {itemRole}
              </option>
            ))}
          </select>
        </div>

        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <article key={user._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{user.fullName}</h3>
                    <p className="text-sm text-slate-600">{user.email || "No email"}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Update Role</p>
                    <div className="mt-2 flex gap-2">
                      <select
                        defaultValue={user.role}
                        onChange={(event) => handleRoleUpdate(user._id, event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {roleOptions.map((itemRole) => (
                          <option key={itemRole} value={itemRole}>
                            {itemRole}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-500">
                        {roleUpdating ? "Updating..." : "Auto-save on change"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Assign Courses (Teacher/Moderator)
                    </p>
                    {user.role === ROLES.TEACHER || user.role === ROLES.MODERATOR ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {batches.map((batch) => {
                            const checked = getDraftBatchIds(user).includes(batch._id);
                            return (
                              <label
                                key={batch._id}
                                className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs"
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
                          className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {assigning ? "Saving..." : "Save Assignment"}
                        </button>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Change role to teacher/moderator to enable batch assignment.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </RequireAuth>
  );
}
