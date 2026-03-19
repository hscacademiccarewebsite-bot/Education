import { baseApi } from "@/lib/features/api/baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.billingYear) {
          query.set("billingYear", String(params.billingYear));
        }
        if (params.billingMonth) {
          query.set("billingMonth", String(params.billingMonth));
        }

        return {
          url: `/analytics/admin-overview${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetAdminAnalyticsQuery } = analyticsApi;
