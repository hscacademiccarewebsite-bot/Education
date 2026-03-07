import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_TAG_TYPES } from "@/src/shared/api/tagTypes";
import { prepareAuthHeaders } from "@/src/shared/api/prepareAuthHeaders";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, context) => prepareAuthHeaders(headers, context.getState),
  }),
  tagTypes: API_TAG_TYPES,
  endpoints: () => ({}),
});

