import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  firebaseUser: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.firebaseUser = action.payload.firebaseUser;
    },
    clearAuth: (state) => {
      state.token = null;
      state.firebaseUser = null;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setInitialized } = authSlice.actions;

export const selectToken = (state) => state.auth.token;
export const selectFirebaseUser = (state) => state.auth.firebaseUser;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectIsAuthInitialized = (state) => state.auth.isInitialized;

export default authSlice.reducer;
