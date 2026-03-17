import { baseApi } from "../api/baseApi";

export const sharedNotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSharedNotes: builder.query({
      query: (params) => ({
        url: "/shared-notes",
        params,
      }),
      // Only cache based on the filter (subject, etc), not the page
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { page, limit, ...rest } = queryArgs || {};
        return `${endpointName}-${JSON.stringify(rest)}`;
      },
      // Merge incoming data into the cache
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...currentCache.data, ...newItems.data],
        };
      },
      // Refetch when the page changes
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "SharedNote", id: _id })),
              { type: "SharedNote", id: "LIST" },
            ]
          : [{ type: "SharedNote", id: "LIST" }],
    }),
    createSharedNote: builder.mutation({
      query: (body) => ({
        url: "/shared-notes",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "SharedNote", id: "LIST" }],
    }),
    updateSharedNote: builder.mutation({
      query: ({ noteId, ...body }) => ({
        url: `/shared-notes/${noteId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { noteId }) => [
        { type: "SharedNote", id: noteId },
        { type: "SharedNote", id: "LIST" },
      ],
    }),
    deleteSharedNote: builder.mutation({
      query: (noteId) => ({
        url: `/shared-notes/${noteId}`,
        method: "DELETE",
      }),
      async onQueryStarted(noteId, { dispatch, queryFulfilled }) {
        const updateNotes = (draft) => {
          if (!draft || !draft.data) return;
          draft.data = draft.data.filter((n) => n._id !== noteId);
        };

        const patches = [
          dispatch(sharedNotesApi.util.updateQueryData("getSharedNotes", {}, updateNotes)),
          dispatch(sharedNotesApi.util.updateQueryData("getSharedNotes", { author: "me" }, updateNotes)),
        ];

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: [{ type: "SharedNote", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSharedNotesQuery,
  useCreateSharedNoteMutation,
  useUpdateSharedNoteMutation,
  useDeleteSharedNoteMutation,
} = sharedNotesApi;
