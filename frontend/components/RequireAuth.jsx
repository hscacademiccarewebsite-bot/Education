"use client";

import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useGetCurrentUserQuery } from "@/lib/features/auth/authApi";
import { selectCurrentUser } from "@/lib/features/user/userSlice";
import { CardLoader } from "@/components/loaders/AppLoader";

export default function RequireAuth({ children, allowedRoles }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const { data, isLoading, isFetching, isError } = useGetCurrentUserQuery(undefined, {
    // Only re-fetch when authenticated and profile is missing.
    skip: !isAuthenticated || Boolean(currentUser),
  });
  const resolvedUser = currentUser || data?.data;

  if (!isAuthenticated) {
    return (
      <div className="container-page py-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Login required. Please use the Login button in the navbar.
        </div>
      </div>
    );
  }

  if (!resolvedUser && (isLoading || isFetching)) {
    return (
      <div className="container-page py-10">
        <CardLoader label="Loading account..." />
      </div>
    );
  }

  if (isError || !resolvedUser) {
    return (
      <div className="container-page py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to validate session. Please log in again.
        </div>
      </div>
    );
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = resolvedUser.role;
    if (!allowedRoles.includes(role)) {
      return (
        <div className="container-page py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            You do not have permission to access this page.
          </div>
        </div>
      );
    }
  }

  return children;
}
