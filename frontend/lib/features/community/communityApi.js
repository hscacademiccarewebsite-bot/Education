import { baseApi } from "../api/baseApi";

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params) => ({
        url: "/community/posts",
        params,
      }),
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
