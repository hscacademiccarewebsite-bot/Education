import { baseApi } from "@/lib/features/api/baseApi";

export const homeApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPublicHome: builder.query({
      query: () => ({
        url: "/public/home",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: [{ type: "Public", id: "HOME" }],
    }),
    getPublicAbout: builder.query({
      query: () => ({
        url: "/public/about",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: [{ type: "Public", id: "ABOUT" }],
    }),
    getPublicFaculty: builder.query({
      query: () => ({
        url: "/public/faculty",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: [{ type: "Public", id: "FACULTY" }],
    }),
    getPublicContact: builder.query({
      query: () => ({
        url: "/public/contact",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: [{ type: "Public", id: "CONTACT" }],
    }),
    getPublicSiteSettings: builder.query({
      query: () => ({
        url: "/public/settings",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: [{ type: "Public", id: "SITE_SETTINGS" }],
    }),

    getAdminSiteSettings: builder.query({
      query: () => ({
        url: "/public/admin/site-settings",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "Public", id: "SITE_SETTINGS_ADMIN" }, { type: "Public", id: "SITE_SETTINGS" }],
    }),

    updateAdminSiteSettings: builder.mutation({
      query: (payload) => ({
        url: "/public/admin/site-settings",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [
        { type: "Public", id: "SITE_SETTINGS_ADMIN" },
        { type: "Public", id: "SITE_SETTINGS" },
        { type: "Public", id: "HOME" },
        { type: "Public", id: "ABOUT" },
        { type: "Public", id: "CONTACT" },
      ],
    }),

    getAdminHeroSlides: builder.query({
      query: () => ({
        url: "/public/admin/hero-slides",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "Public", id: "HERO_ADMIN" }, { type: "Public", id: "HOME" }],
    }),

    createHeroSlide: builder.mutation({
      query: (payload) => ({
        url: "/public/admin/hero-slides",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Public", id: "HERO_ADMIN" }, { type: "Public", id: "HOME" }],
    }),

    updateHeroSlide: builder.mutation({
      query: ({ slideId, ...payload }) => ({
        url: `/public/admin/hero-slides/${slideId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [{ type: "Public", id: "HERO_ADMIN" }, { type: "Public", id: "HOME" }],
    }),

    deleteHeroSlide: builder.mutation({
      query: (slideId) => ({
        url: `/public/admin/hero-slides/${slideId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Public", id: "HERO_ADMIN" }, { type: "Public", id: "HOME" }],
    }),

    reorderHeroSlides: builder.mutation({
      query: (orderedSlideIds) => ({
        url: "/public/admin/hero-slides/reorder",
        method: "PATCH",
        body: { orderedSlideIds },
      }),
      invalidatesTags: [{ type: "Public", id: "HERO_ADMIN" }, { type: "Public", id: "HOME" }],
    }),
  }),
});

export const {
  useGetPublicHomeQuery,
  useGetPublicAboutQuery,
  useGetPublicFacultyQuery,
  useGetPublicContactQuery,
  useGetPublicSiteSettingsQuery,
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
  useGetAdminHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useReorderHeroSlidesMutation,
} = homeApi;
