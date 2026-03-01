import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  firebaseUser: null,
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
  },
});

export const { setAuth, clearAuth } = authSlice.actions;

export const selectToken = (state) => state.auth.token;
export const selectFirebaseUser = (state) => state.auth.firebaseUser;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);

export default authSlice.reducer;
