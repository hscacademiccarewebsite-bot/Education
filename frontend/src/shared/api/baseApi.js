import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_TAG_TYPES } from "@/src/shared/api/tagTypes";
import { prepareAuthHeaders } from "@/src/shared/api/prepareAuthHeaders";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, context) => prepareAuthHeaders(headers, context.getState),
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    // Global unauthorized redirect. We can't use useRouter() here, so we use window.location
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: API_TAG_TYPES,
  endpoints: () => ({}),
});

