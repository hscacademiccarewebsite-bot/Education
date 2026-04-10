import { createSelector, createSlice } from "@reduxjs/toolkit";
import { clearAuth } from "@/lib/features/auth/authSlice";
import { authApi } from "@/lib/features/auth/authApi";

const initialState = {
  profile: null,
  status: "idle",
  error: null,
  lastSyncedAt: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearCurrentUser: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearAuth, () => initialState)
      .addMatcher(authApi.endpoints.getCurrentUser.matchPending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addMatcher(authApi.endpoints.getCurrentUser.matchFulfilled, (state, action) => {
        state.profile = action.payload?.data || null;
        state.status = "succeeded";
        state.error = null;
        state.lastSyncedAt = Date.now();
      })
      .addMatcher(authApi.endpoints.getCurrentUser.matchRejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message || "Failed to load current user.";
      })
      .addMatcher(authApi.endpoints.registerUser.matchFulfilled, (state, action) => {
        if (action.payload?.data) {
          state.profile = action.payload.data;
          state.status = "succeeded";
          state.error = null;
          state.lastSyncedAt = Date.now();
        }
      })
      .addMatcher(authApi.endpoints.updateCurrentUser.matchFulfilled, (state, action) => {
        if (action.payload?.data) {
          state.profile = action.payload.data;
          state.status = "succeeded";
          state.error = null;
          state.lastSyncedAt = Date.now();
        }
      });
  },
});

export const { clearCurrentUser } = userSlice.actions;

export const selectCurrentUser = (state) => state.user.profile;
export const selectCurrentUserRole = (state) => state.user.profile?.role;
export const selectCurrentUserAcademicStatus = (state) => state.user.profile?.academicStatus;
export const selectCurrentUserAcademicBatchLabel = (state) => state.user.profile?.academicBatchLabel;
export const selectCurrentUserStatus = (state) => state.user.status;
export const selectCurrentUserError = (state) => state.user.error;
export const selectCurrentUserId = (state) => state.user.profile?._id;

export const selectCurrentUserDisplayName = createSelector(
  [selectCurrentUser, (state) => state.auth.firebaseUser],
  (currentUser, firebaseUser) =>
    currentUser?.fullName ||
    firebaseUser?.displayName ||
    firebaseUser?.email ||
    currentUser?.email ||
    ""
);

export const selectCurrentUserPhotoUrl = createSelector(
  [selectCurrentUser, (state) => state.auth.firebaseUser],
  (currentUser, firebaseUser) => currentUser?.profilePhoto?.url || firebaseUser?.photoURL || ""
);

export default userSlice.reducer;
