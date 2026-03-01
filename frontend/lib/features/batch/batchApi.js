import { baseApi } from "@/lib/features/api/baseApi";

export const batchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listBatches: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) {
          query.set("status", params.status);
        }

        return {
          url: `/courses${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      keepUnusedDataFor: 300,
      refetchOnReconnect: true,
      refetchOnFocus: true,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((batch) => ({ type: "Batch", id: batch._id })),
              { type: "Batch", id: "LIST" },
            ]
          : [{ type: "Batch", id: "LIST" }],
    }),

    getBatchById: builder.query({
      query: (batchId) => ({
        url: `/courses/${batchId}`,
        method: "GET",
      }),
      providesTags: (_, __, batchId) => [{ type: "Batch", id: batchId }],
    }),

    createBatch: builder.mutation({
      query: (payload) => ({
        url: "/courses",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Batch", id: "LIST" }],
    }),

    updateBatch: builder.mutation({
      query: ({ batchId, ...payload }) => ({
        url: `/courses/${batchId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, { batchId }) => [
        { type: "Batch", id: batchId },
        { type: "Batch", id: "LIST" },
      ],
    }),

    deleteBatch: builder.mutation({
      query: (batchId) => ({
        url: `/courses/${batchId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, batchId) => [
        { type: "Batch", id: batchId },
        { type: "Batch", id: "LIST" },
        { type: "Enrollment", id: "MY" },
        { type: "Enrollment", id: "REVIEW" },
        { type: "Payment", id: "MY" },
        { type: "Payment", id: "GLOBAL" },
      ],
    }),

    updateBatchStaff: builder.mutation({
      query: ({ batchId, teacherIds, moderatorIds }) => ({
        url: `/courses/${batchId}/staff`,
        method: "PATCH",
        body: { teacherIds, moderatorIds },
      }),
      invalidatesTags: (_, __, { batchId }) => [
        { type: "Batch", id: batchId },
        { type: "Batch", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),

    listBatchStudents: builder.query({
      query: (batchId) => ({
        url: `/courses/${batchId}/students`,
        method: "GET",
      }),
      providesTags: (_, __, batchId) => [{ type: "Enrollment", id: `BATCH_STUDENTS_${batchId}` }],
    }),
  }),
});

export const {
  useListBatchesQuery,
  useGetBatchByIdQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
  useUpdateBatchStaffMutation,
  useListBatchStudentsQuery,
} = batchApi;
