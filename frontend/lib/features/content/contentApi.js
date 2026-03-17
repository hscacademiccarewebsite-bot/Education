import { baseApi } from "@/lib/features/api/baseApi";

const normalizeArg = (arg, idKey) =>
  typeof arg === "object" && arg !== null ? arg : { [idKey]: arg };

export const contentApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listSubjects: builder.query({
      query: (batchId) => ({
        url: `/subjects?batchId=${batchId}`,
        method: "GET",
      }),
      providesTags: (result, _, batchId) =>
        result?.data
          ? [
              ...result.data.map((subject) => ({ type: "Subject", id: subject._id })),
              { type: "Subject", id: `LIST_${batchId}` },
            ]
          : [{ type: "Subject", id: `LIST_${batchId}` }],
    }),

    getSubjectById: builder.query({
      query: (subjectId) => ({
        url: `/subjects/${subjectId}`,
        method: "GET",
      }),
      providesTags: (_, __, subjectId) => [{ type: "Subject", id: subjectId }],
    }),

    createSubject: builder.mutation({
      query: (payload) => ({
        url: "/subjects",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_, __, payload) => [{ type: "Subject", id: `LIST_${payload.batchId}` }],
    }),

    updateSubject: builder.mutation({
      query: ({ subjectId, ...payload }) => ({
        url: `/subjects/${subjectId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, arg) => {
        const { subjectId, batchId } = normalizeArg(arg, "subjectId");
        return [
          { type: "Subject", id: subjectId },
          ...(batchId ? [{ type: "Subject", id: `LIST_${batchId}` }] : []),
        ];
      },
    }),

    deleteSubject: builder.mutation({
      query: (arg) => {
        const { subjectId } = normalizeArg(arg, "subjectId");
        return {
          url: `/subjects/${subjectId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_, __, arg) => {
        const { subjectId, batchId } = normalizeArg(arg, "subjectId");
        return [
          { type: "Subject", id: subjectId },
          ...(batchId ? [{ type: "Subject", id: `LIST_${batchId}` }] : []),
          { type: "Chapter", id: `LIST_${subjectId}` },
        ];
      },
    }),

    listChapters: builder.query({
      query: (subjectId) => ({
        url: `/chapters?subjectId=${subjectId}`,
        method: "GET",
      }),
      providesTags: (result, _, subjectId) =>
        result?.data
          ? [
              ...result.data.map((chapter) => ({ type: "Chapter", id: chapter._id })),
              { type: "Chapter", id: `LIST_${subjectId}` },
            ]
          : [{ type: "Chapter", id: `LIST_${subjectId}` }],
    }),

    getChapterById: builder.query({
      query: (chapterId) => ({
        url: `/chapters/${chapterId}`,
        method: "GET",
      }),
      providesTags: (_, __, chapterId) => [{ type: "Chapter", id: chapterId }],
    }),

    createChapter: builder.mutation({
      query: (payload) => ({
        url: "/chapters",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_, __, payload) => [{ type: "Chapter", id: `LIST_${payload.subjectId}` }],
    }),

    updateChapter: builder.mutation({
      query: ({ chapterId, ...payload }) => ({
        url: `/chapters/${chapterId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, arg) => {
        const { chapterId, subjectId } = normalizeArg(arg, "chapterId");
        return [
          { type: "Chapter", id: chapterId },
          ...(subjectId ? [{ type: "Chapter", id: `LIST_${subjectId}` }] : []),
        ];
      },
    }),

    deleteChapter: builder.mutation({
      query: (arg) => {
        const { chapterId } = normalizeArg(arg, "chapterId");
        return {
          url: `/chapters/${chapterId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_, __, arg) => {
        const { chapterId, subjectId } = normalizeArg(arg, "chapterId");
        return [
          { type: "Chapter", id: chapterId },
          ...(subjectId ? [{ type: "Chapter", id: `LIST_${subjectId}` }] : []),
          { type: "Video", id: `LIST_${chapterId}` },
        ];
      },
    }),

    listVideos: builder.query({
      query: (chapterId) => ({
        url: `/videos?chapterId=${chapterId}`,
        method: "GET",
      }),
      providesTags: (result, _, chapterId) =>
        result?.data
          ? [
              ...result.data.map((video) => ({ type: "Video", id: video._id })),
              { type: "Video", id: `LIST_${chapterId}` },
            ]
          : [{ type: "Video", id: `LIST_${chapterId}` }],
    }),

    getVideoById: builder.query({
      query: (videoId) => ({
        url: `/videos/${videoId}`,
        method: "GET",
      }),
      providesTags: (_, __, videoId) => [{ type: "Video", id: videoId }],
    }),

    createVideo: builder.mutation({
      query: (payload) => ({
        url: "/videos",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_, __, payload) => [{ type: "Video", id: `LIST_${payload.chapterId}` }],
    }),

    updateVideo: builder.mutation({
      query: ({ videoId, ...payload }) => ({
        url: `/videos/${videoId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, arg) => {
        const { videoId, chapterId } = normalizeArg(arg, "videoId");
        return [
          { type: "Video", id: videoId },
          ...(chapterId ? [{ type: "Video", id: `LIST_${chapterId}` }] : []),
        ];
      },
    }),

    deleteVideo: builder.mutation({
      query: (arg) => {
        const { videoId } = normalizeArg(arg, "videoId");
        return {
          url: `/videos/${videoId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_, __, arg) => {
        const { videoId, chapterId } = normalizeArg(arg, "videoId");
        return [
          { type: "Video", id: videoId },
          ...(chapterId ? [{ type: "Video", id: `LIST_${chapterId}` }] : []),
        ];
      },
    }),
    
    // Notes
    listNotes: builder.query({
      query: (subjectId) => ({
        url: `/notes?subjectId=${subjectId}`,
        method: "GET",
      }),
      providesTags: (result, _, subjectId) =>
        result?.data
          ? [
              ...result.data.map((note) => ({ type: "Note", id: note._id })),
              { type: "Note", id: `LIST_${subjectId}` },
            ]
          : [{ type: "Note", id: `LIST_${subjectId}` }],
    }),

    createNote: builder.mutation({
      query: (payload) => ({
        url: "/notes",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_, __, payload) => [{ type: "Note", id: `LIST_${payload.subjectId}` }],
    }),

    updateNote: builder.mutation({
      query: ({ noteId, ...payload }) => ({
        url: `/notes/${noteId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, arg) => {
        const { noteId, subjectId } = normalizeArg(arg, "noteId");
        return [
          { type: "Note", id: noteId },
          ...(subjectId ? [{ type: "Note", id: `LIST_${subjectId}` }] : []),
        ];
      },
    }),

    deleteNote: builder.mutation({
      query: (arg) => {
        const { noteId } = normalizeArg(arg, "noteId");
        return {
          url: `/notes/${noteId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_, __, arg) => {
        const { noteId, subjectId } = normalizeArg(arg, "noteId");
        return [
          { type: "Note", id: noteId },
          ...(subjectId ? [{ type: "Note", id: `LIST_${subjectId}` }] : []),
        ];
      },
    }),
  }),
});

export const {
  useListSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useListChaptersQuery,
  useGetChapterByIdQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useListVideosQuery,
  useGetVideoByIdQuery,
  useCreateVideoMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
  useListNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = contentApi;
