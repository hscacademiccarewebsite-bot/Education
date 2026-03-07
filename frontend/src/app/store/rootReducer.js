import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import userReducer from "@/lib/features/user/userSlice";
import { baseApi } from "@/src/shared/api/baseApi";

export const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

