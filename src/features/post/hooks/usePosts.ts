import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { postService, toPostPayload } from "../service/post.service";
import type {
  PostFilter,
  PostPayload,
  PostResponse,
} from "../types/post.types";

/** Danh sách bài đăng công khai (cursor-based). */
export function usePosts(params: Omit<PostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(params),

    queryFn: async ({ pageParam }) => {
      const result = await postService.getPosts({
        ...params,
        cursor: pageParam as string | undefined,
      });

      if (
        !result ||
        !Array.isArray(result.content) ||
        typeof result.hasNext !== "boolean"
      ) {
        console.error("Invalid getPosts response:", result);
        throw new Error("Invalid pagination response from GET /v1/posts");
      }

      return result;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;

      return lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined;
    },
  });
}

/** Chi tiết một bài đăng. */
export function usePost(id: string | undefined, opts: { mine?: boolean } = {}) {
  return useQuery({
    queryKey: [
      ...queryKeys.posts.detail(id ?? ""),
      opts.mine ? "mine" : "public",
    ],
    queryFn: () => postService.getPostById(id ?? "", opts.mine),
    enabled: Boolean(id),
    retry: false,
  });
}

/**
 * Bài đăng của người dùng hiện tại.
 * BE trả CursorResponse → dùng useInfiniteQuery để hỗ trợ "xem thêm".
 */
export function useMyPosts(params: Omit<PostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.mine, params],

    queryFn: async ({ pageParam }) => {
      const result = await postService.getMyPosts({
        ...params,
        cursor: pageParam as string | undefined,
      });

      if (
        !result ||
        !Array.isArray(result.content) ||
        typeof result.hasNext !== "boolean"
      ) {
        console.error("Invalid getMyPosts response:", result);
        throw new Error("Invalid pagination response from GET /v1/posts/me");
      }

      return result;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasNext) return undefined;

      return lastPage.nextCursor ?? undefined;
    },
  });
}

/** Tập hợp các mutation: tạo, sửa, xóa, duyệt, đóng bài. */
export function usePostMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.posts.all });

  const create = useMutation({
    mutationFn: (v: { payload: PostPayload; asDraft: boolean }) =>
      postService.createPost(v.payload, v.asDraft),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (v: {
      id: string;
      payload: PostPayload;
      status?: "DRAFT" | "PUBLISHED";
    }) => postService.updatePost(v.id, v.payload, v.status),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: (id: string) => postService.publishPost(id),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: (post: PostResponse) =>
      postService.updatePost(post.id, toPostPayload(post), "DRAFT"),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: (id: string) => postService.closePost(id),
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    remove,
    publish,
    unpublish,
    close,
    createPost: create,
    updatePost: update,
  };
}
