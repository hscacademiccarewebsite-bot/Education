"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { useGetCurrentUserQuery } from "@/lib/features/auth/authApi";
import { selectCurrentUser } from "@/lib/features/user/userSlice";
import AuthSkeleton from "@/components/loaders/AuthSkeleton";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function RequireAuth({ children, allowedRoles }) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const currentUser = useSelector(selectCurrentUser);
  const { t } = useSiteLanguage();

  const { data, isLoading, isFetching, isError } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated || Boolean(currentUser),
  });

  const resolvedUser = currentUser || data?.data;

  useEffect(() => {
    // If auth state is settled and user is definitely not logged in, boot to home.
    if (isInitialized && !isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    // If we have a user but they don't have the required role, boot to home.
    if (resolvedUser && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(resolvedUser.role)) {
        router.replace("/");
      }
    }
  }, [resolvedUser, allowedRoles, router]);

  // Phase 1: Waiting for Firebase to tell us IF someone is here.
  if (!isInitialized) {
    return <AuthSkeleton />;
  }

  // Phase 2: Not authenticated -> booting to home (handled by useEffect, but return null to be safe).
  if (!isAuthenticated) {
    return null;
  }

  // Phase 3: Authenticated, but fetching the backend profile.
  if (!resolvedUser && (isLoading || isFetching)) {
    return <AuthSkeleton />;
  }

  // Phase 4: Error or no user found after checks.
  if (isError || !resolvedUser) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="font-bold text-rose-700">{t("requireAuth.verificationFailed")}</p>
          <button
            onClick={() => router.replace("/")}
            className="site-button-primary mt-4"
          >
            {t("requireAuth.backToHome")}
          </button>
        </div>
      </div>
    );
  }

  // Phase 5: Role protection check (handled by useEffect, but check here to avoid flicker).
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(resolvedUser.role)) {
      return null;
    }
  }

  return children;
}
