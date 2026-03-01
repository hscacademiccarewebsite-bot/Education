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

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    assignBatchesToStaff: builder.mutation({
      query: ({ userId, batchIds }) => ({
        url: `/users/${userId}/assign-batches`,
        method: "PATCH",
        body: { batchIds },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "Batch", id: "LIST" }],
    }),
  }),
});

export const { useListUsersQuery, useUpdateUserRoleMutation, useAssignBatchesToStaffMutation } =
  userApi;
