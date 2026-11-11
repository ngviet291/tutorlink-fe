import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import type {
  MyPostFilter,
  PostFilter,
  PostPayload,
} from "../types/post.types";
import { postService } from "@/config/di/container";

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

/**
 * Chi tiết bài cho trang xem:
 * - Chưa đăng nhập: dùng endpoint công khai.
 * - Đã đăng nhập: thử /me trước (chủ bài xem được cả nháp); /me lỗi thì dùng endpoint công khai.
 */
export function usePostDetail(id: string | undefined, isLoggedIn: boolean) {
  const me = usePostForMe(isLoggedIn ? id : undefined);
  const needPublic = !isLoggedIn || me.isError;
  const pub = usePost(needPublic ? id : undefined);

  if (!isLoggedIn) return pub;
  if (me.data) return me;
  if (me.isError) return pub;
  return me; // /me đang tải
}

/** Chi tiết một bài đăng. */
export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id ?? ""),
    queryFn: () => postService.getPostById(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

/** Chi tiết bài đăng kèm thông tin của người đang xem (GET /v1/posts/{id}/me). */
export function usePostForMe(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detailMe(id ?? ""),
    queryFn: () => postService.getPostByIdForMe(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

/**
 * Bài đăng của người dùng hiện tại.
 * BE trả CursorResponse → dùng useInfiniteQuery để hỗ trợ "xem thêm".
 */
export function useMyPosts(params: Omit<MyPostFilter, "cursor"> = {}) {
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

/** Danh sách đơn ứng tuyển của một bài đăng (cursor-based). */
export function usePostApplications(postId: string | undefined, limit = 10) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.applications(postId ?? ""),
    queryFn: ({ pageParam }) =>
      postService.getPostApplications(postId ?? "", pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : undefined),
    enabled: Boolean(postId),
  });
}

/** Thống kê số bài theo trạng thái. */
export function usePostStatistics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.posts.statistics,
    queryFn: () => postService.getStatistics(),
    enabled,
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
    mutationFn: (v: { id: string; payload: PostPayload }) =>
      postService.updatePost(v.id, v.payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: async (_, id) => {
      await qc.cancelQueries({ queryKey: queryKeys.posts.detail(id) });
      await qc.cancelQueries({ queryKey: queryKeys.posts.detailMe(id) });
      qc.removeQueries({ queryKey: queryKeys.posts.detail(id) });
      qc.removeQueries({ queryKey: queryKeys.posts.detailMe(id) });
      qc.removeQueries({ queryKey: queryKeys.posts.applications(id) });
      qc.invalidateQueries({
        queryKey: queryKeys.posts.all,
        predicate: (q) => !q.queryKey.includes(id),
      });
    },
  });
  const publish = useMutation({
    mutationFn: (id: string) => postService.publishPost(id),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: (id: string) => postService.closePost(id),
    onSuccess: invalidate,
  });

  const removeByAdmin = useMutation({
    mutationFn: (v: { id: string; reason?: string }) =>
      postService.removePostByAdmin(v.id, v.reason),
    onSuccess: invalidate,
  });

  // Alias để các page cũ không cần đổi tên gọi
  return {
    create,
    update,
    remove,
    publish,
    close,
    removeByAdmin,
    createPost: create,
    updatePost: update,
  };
}
