import { baseApi } from "@/lib/features/api/baseApi";

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: ({ token, ...payload }) => ({
        url: "/users/register",
        method: "POST",
        body: payload,
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      }),
      invalidatesTags: ["User"],
    }),
    getCurrentUser: builder.query({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: ["User"],
    }),
  }),
});

export const { useRegisterUserMutation, useGetCurrentUserQuery, useLazyGetCurrentUserQuery } =
  authApi;
