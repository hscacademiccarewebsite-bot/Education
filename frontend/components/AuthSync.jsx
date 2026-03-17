"use client";

import { useEffect, useRef } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { auth } from "@/firebase.config";
import { clearAuth, setAuth, setInitialized } from "@/lib/features/auth/authSlice";
import { baseApi } from "@/lib/features/api/baseApi";
import {
  useLazyGetCurrentUserQuery,
  useRegisterUserMutation,
} from "@/lib/features/auth/authApi";

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error?.data?.message) {
    return error.data.message;
  }
  if (error?.error) {
    return error.error;
  }
  if (error?.message) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const isNetworkFetchError = (errorMessage) => {
  if (typeof errorMessage !== "string") return false;
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network request failed") ||
    lowerMessage.includes("network-request-failed") ||
    lowerMessage.includes("fetch_error") ||
    lowerMessage.includes("auth/network-request-failed")
  );
};

export default function AuthSync() {
  const dispatch = useDispatch();
  const [registerUser] = useRegisterUserMutation();
  const [triggerGetCurrentUser] = useLazyGetCurrentUserQuery();
  const syncedUidRef = useRef(null);
  const warnedNetworkRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        syncedUidRef.current = null;
        warnedNetworkRef.current = false;
        dispatch(clearAuth());
        dispatch(baseApi.util.resetApiState());
        dispatch(setInitialized(true));
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const plainUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        dispatch(setAuth({ token, firebaseUser: plainUser }));

        // Keep backend user profile in sync once per sign-in session.
        if (syncedUidRef.current !== firebaseUser.uid) {
          const registerPayload = {
            email: firebaseUser.email,
            fullName:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "Student User",
          };

          try {
            await registerUser({
              ...registerPayload,
              token,
            }).unwrap();
          } catch {
            // Token can be stale right after sign-in on some clients, refresh once and retry.
            const refreshedToken = await firebaseUser.getIdToken(true);
            dispatch(setAuth({ token: refreshedToken, firebaseUser: plainUser }));
            await registerUser({
              ...registerPayload,
              token: refreshedToken,
            }).unwrap();
          }

          syncedUidRef.current = firebaseUser.uid;
        }

        await triggerGetCurrentUser().unwrap();
        warnedNetworkRef.current = false;
        dispatch(setInitialized(true));
      } catch (error) {
        const message = extractErrorMessage(error);
        if (isNetworkFetchError(message)) {
          if (!warnedNetworkRef.current) {
            warnedNetworkRef.current = true;
            console.warn(
              "Auth sync skipped: backend API is unreachable. Check NEXT_PUBLIC_API_BASE_URL and backend server."
            );
          }
          dispatch(setInitialized(true));
          return;
        }

        console.error("Auth sync failed:", message, error);
        dispatch(setInitialized(true));
      }
    });

    return () => unsubscribe();
  }, [dispatch, registerUser, triggerGetCurrentUser]);

  return null;
}
