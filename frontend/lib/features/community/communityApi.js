import { baseApi } from "../api/baseApi";

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params) => ({
        url: "/community/posts",
        params,
      }),
      // Only cache based on the filter (author, etc), not the page
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
              ...result.data.map(({ _id }) => ({ type: "Community", id: _id })),
              { type: "Community", id: "LIST" },
            ]
          : [{ type: "Community", id: "LIST" }],
    }),
    getPostById: builder.query({
      query: (postId) => ({
        url: `/community/posts/${postId}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [{ type: "Community", id: arg }],
    }),
    createPost: builder.mutation({
      query: (data) => ({
        url: "/community/posts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Community", id: "LIST" }],
    }),
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/community/posts/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const updatePosts = (draft) => {
          if (!draft || !draft.data) return;
          const post = draft.data.find((p) => p._id === postId);
          if (post) {
            post.isLiked = !post.isLiked;
            post.likesCount += post.isLiked ? 1 : -1;
          }
        };

        const patches = [
          dispatch(communityApi.util.updateQueryData("getPosts", {}, (draft) => updatePosts(draft))),
          dispatch(communityApi.util.updateQueryData("getPosts", { author: "me" }, (draft) => updatePosts(draft))),
          dispatch(communityApi.util.updateQueryData("getPostById", postId, (draft) => {
            if (draft && draft.data) {
              draft.data.isLiked = !draft.data.isLiked;
              draft.data.likesCount += draft.data.isLiked ? 1 : -1;
            }
          })),
        ];

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: "Community", id: arg }],
    }),
    updatePost: builder.mutation({
      query: ({ postId, ...data }) => ({
        url: `/community/posts/${postId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Community", id: postId },
        { type: "Community", id: "LIST" },
      ],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/community/posts/${postId}`,
        method: "DELETE",
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const updatePosts = (draft) => {
          if (!draft || !draft.data) return;
          draft.data = draft.data.filter((p) => p._id !== postId);
        };

        const patches = [
          dispatch(communityApi.util.updateQueryData("getPosts", {}, updatePosts)),
          dispatch(communityApi.util.updateQueryData("getPosts", { author: "me" }, updatePosts)),
        ];

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: [{ type: "Community", id: "LIST" }],
    }),
    getComments: builder.query({
      query: ({ postId, ...params }) => ({
        url: `/community/posts/${postId}/comments`,
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Comment", id: _id })),
              { type: "Comment", id: "LIST" },
            ]
          : [{ type: "Comment", id: "LIST" }],
    }),
    addComment: builder.mutation({
      query: ({ postId, ...data }) => ({
        url: `/community/posts/${postId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Community", id: postId },
        { type: "Comment", id: "LIST" },
      ],
    }),
    likeComment: builder.mutation({
      query: (commentId) => ({
        url: `/community/comments/${commentId}/like`,
        method: "POST",
      }),
      async onQueryStarted(commentId, { dispatch, queryFulfilled }) {
        // Since we don't know the postId for getComments, we can't easily patch it without knowing the arg.
        // However, we can use updateAllQueryData (custom logic) or just invalidate as is.
        // For simplicity and correctness with RTK Query, we'll keep it as is unless we track active getComments args.
        try {
          await queryFulfilled;
        } catch {}
      },
      invalidatesTags: (result, error, arg) => [{ type: "Comment", id: arg }],
    }),
    updateComment: builder.mutation({
      query: ({ commentId, ...data }) => ({
        url: `/community/comments/${commentId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { commentId }) => [{ type: "Comment", id: commentId }],
    }),
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/community/comments/${commentId}`,
        method: "DELETE",
      }),
      async onQueryStarted(commentId, { dispatch, queryFulfilled, getState }) {
        // We iterate through all active getComments queries to find the one containing this comment
        const state = getState();
        const apiState = state[communityApi.reducerPath];
        const commentQueries = apiState?.queries || {};
        const activePostIds = Object.keys(commentQueries)
          .filter(key => key.startsWith('getComments-'))
          .map(key => JSON.parse(key.replace('getComments-', '')).postId);

        const patches = activePostIds.map(postId => 
          dispatch(
            communityApi.util.updateQueryData("getComments", { postId }, (draft) => {
              if (!draft || !draft.data) return;
              draft.data = draft.data.filter((c) => c._id !== commentId);
            })
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: () => [{ type: "Comment", id: "LIST" }, { type: "Community", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useLikeCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = communityApi;
