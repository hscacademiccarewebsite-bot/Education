import { baseApi } from "@/lib/features/api/baseApi";

export const paymentApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyPayments: builder.query({
      query: () => ({
        url: "/payments/my",
        method: "GET",
      }),
      providesTags: [{ type: "Payment", id: "MY" }],
    }),

    getBatchPayments: builder.query({
      query: ({ batchId, status, billingYear, billingMonth, page, limit, search } = {}) => {
        const query = new URLSearchParams();
        if (status) {
          query.set("status", status);
        }
        if (billingYear) {
          query.set("billingYear", String(billingYear));
        }
        if (billingMonth) {
          query.set("billingMonth", String(billingMonth));
        }
        if (page) {
          query.set("page", String(page));
        }
        if (limit) {
          query.set("limit", String(limit));
        }
        if (search?.trim()) {
          query.set("search", search.trim());
        }
        return {
          url: `/payments/batch/${batchId}${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (_, __, { batchId }) => [{ type: "Payment", id: `BATCH_${batchId}` }],
    }),

    getGlobalPayments: builder.query({
      query: ({ status, billingYear, billingMonth, page, limit, search, summaryOnly } = {}) => {
        const query = new URLSearchParams();
        if (status) {
          query.set("status", status);
        }
        if (billingYear) {
          query.set("billingYear", String(billingYear));
        }
        if (billingMonth) {
          query.set("billingMonth", String(billingMonth));
        }
        if (page) {
          query.set("page", String(page));
        }
        if (limit) {
          query.set("limit", String(limit));
        }
        if (search?.trim()) {
          query.set("search", search.trim());
        }
        if (summaryOnly) {
          query.set("summaryOnly", "true");
        }
        return {
          url: `/payments/global${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: [{ type: "Payment", id: "GLOBAL" }],
    }),

    generateMonthlyDues: builder.mutation({
      query: (payload) => ({
        url: "/payments/generate-dues",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Payment", id: "GLOBAL" }, { type: "Payment", id: "MY" }],
    }),

    markPaymentOfflinePaid: builder.mutation({
      query: ({ paymentId, note }) => ({
        url: `/payments/${paymentId}/mark-offline-paid`,
        method: "PATCH",
        body: { note },
      }),
      invalidatesTags: [{ type: "Payment", id: "GLOBAL" }, { type: "Payment", id: "MY" }],
    }),

    markPaymentOnlinePaid: builder.mutation({
      query: ({ paymentId, ...payload }) => ({
        url: `/payments/${paymentId}/mark-online-paid`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [{ type: "Payment", id: "MY" }, { type: "Payment", id: "GLOBAL" }],
    }),

    createBkashPayment: builder.mutation({
      query: ({ paymentId }) => ({
        url: `/payments/bkash/create`,
        method: "POST",
        body: { paymentId },
      }),
      // We don't invalidate yet; we only get the URL redirect.
    }),

    executeBkashPayment: builder.mutation({
      query: ({ paymentID, paymentId }) => ({
        url: `/payments/bkash/execute`,
        method: "POST",
        body: { paymentID, paymentId },
      }),
      invalidatesTags: [{ type: "Payment", id: "MY" }, { type: "Payment", id: "GLOBAL" }],
    }),

    waivePayment: builder.mutation({
      query: ({ paymentId, note }) => ({
        url: `/payments/${paymentId}/waive`,
        method: "PATCH",
        body: { note },
      }),
      invalidatesTags: [{ type: "Payment", id: "GLOBAL" }, { type: "Payment", id: "MY" }],
    }),
  }),
});

export const {
  useGetMyPaymentsQuery,
  useGetBatchPaymentsQuery,
  useGetGlobalPaymentsQuery,
  useGenerateMonthlyDuesMutation,
  useMarkPaymentOfflinePaidMutation,
  useMarkPaymentOnlinePaidMutation,
  useCreateBkashPaymentMutation,
  useExecuteBkashPaymentMutation,
  useWaivePaymentMutation,
} = paymentApi;
