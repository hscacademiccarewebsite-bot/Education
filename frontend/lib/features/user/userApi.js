import { baseApi } from "@/lib/features/api/baseApi";

export const userApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listUsers: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.role) {
          query.set("role", params.role);
        }
        if (params.academicStatus) {
          query.set("academicStatus", params.academicStatus);
        }
        if (params.isActive !== undefined) {
          query.set("isActive", String(params.isActive));
        }
        if (params.batchId) {
          query.set("batchId", params.batchId);
        }

        return {
          url: `/users${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "User", id: "LIST" }],
    }),

    getUserDetails: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/details`,
        method: "GET",
      }),
      providesTags: (_, __, userId) => [{ type: "User", id: String(userId || "DETAILS") }],
    }),

    getPublicUserProfile: builder.query({
      query: (userId) => ({
        url: `/users/${userId}/profile`,
        method: "GET",
      }),
      providesTags: (_, __, userId) => [{ type: "User", id: `PUBLIC-${String(userId || "PROFILE")}` }],
    }),

    getAcademicBatches: builder.query({
      query: () => ({
        url: "/users/academic-batches",
        method: "GET",
      }),
      providesTags: [{ type: "User", id: "ACADEMIC_BATCHES" }],
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["User", { type: "User", id: "LIST" }, { type: "User", id: "ACADEMIC_BATCHES" }],
    }),

    updateGraduationStatus: builder.mutation({
      query: ({ userId, isExStudent }) => ({
        url: `/users/${userId}/graduation-status`,
        method: "PATCH",
        body: { isExStudent },
      }),
      invalidatesTags: [
        "User",
        { type: "User", id: "LIST" },
        { type: "User", id: "ACADEMIC_BATCHES" },
      ],
    }),

    updateBatchGraduationStatus: builder.mutation({
      query: ({ batchYear, isExStudent }) => ({
        url: `/users/academic-batches/${batchYear}/graduation-status`,
        method: "PATCH",
        body: { isExStudent },
      }),
      invalidatesTags: [
        "User",
        { type: "User", id: "LIST" },
        { type: "User", id: "ACADEMIC_BATCHES" },
      ],
    }),

    assignBatchesToStaff: builder.mutation({
      query: ({ userId, batchIds }) => ({
        url: `/users/${userId}/assign-batches`,
        method: "PATCH",
        body: { batchIds },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "Batch", id: "LIST" }],
    }),

    searchUsers: builder.query({
      query: (q) => ({
        url: `/users/search?q=${q}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserDetailsQuery,
  useGetPublicUserProfileQuery,
  useGetAcademicBatchesQuery,
  useUpdateUserRoleMutation,
  useUpdateGraduationStatusMutation,
  useUpdateBatchGraduationStatusMutation,
  useAssignBatchesToStaffMutation,
  useSearchUsersQuery,
} = userApi;
