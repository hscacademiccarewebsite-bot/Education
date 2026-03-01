import { baseApi } from "@/lib/features/api/baseApi";

export const enrollmentApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createEnrollmentRequest: builder.mutation({
      query: (payload) => ({
        url: "/enrollments",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Enrollment", id: "MY" }, { type: "Enrollment", id: "REVIEW" }],
    }),

    getMyEnrollmentRequests: builder.query({
      query: () => ({
        url: "/enrollments/my",
        method: "GET",
      }),
      providesTags: [{ type: "Enrollment", id: "MY" }],
    }),

    getEnrollmentRequestsForReview: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.batchId) {
          query.set("batchId", params.batchId);
        }
        if (params.status) {
          query.set("status", params.status);
        }

        return {
          url: `/enrollments/review${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Enrollment", id: "REVIEW" }],
    }),

    reviewEnrollmentRequest: builder.mutation({
      query: ({ enrollmentId, status, rejectionReason }) => ({
        url: `/enrollments/${enrollmentId}/status`,
        method: "PATCH",
        body: { status, rejectionReason },
      }),
      invalidatesTags: [
        { type: "Enrollment", id: "REVIEW" },
        { type: "Enrollment", id: "MY" },
        { type: "Payment", id: "MY" },
      ],
    }),
  }),
});

export const {
  useCreateEnrollmentRequestMutation,
  useGetMyEnrollmentRequestsQuery,
  useGetEnrollmentRequestsForReviewQuery,
  useReviewEnrollmentRequestMutation,
} = enrollmentApi;
