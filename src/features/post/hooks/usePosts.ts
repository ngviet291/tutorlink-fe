import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { postService } from "../service/post.service";
import type { PostFilter, PostPayload } from "../types/post.types";

/** Danh sách bài đăng công khai (cursor-based). */
export function usePosts(params: Omit<PostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: ({ pageParam }) =>
      postService.getPosts({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
  });
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

/**
 * Bài đăng của người dùng hiện tại.
 * BE trả CursorResponse → dùng useInfiniteQuery để hỗ trợ "xem thêm".
 */
export function useMyPosts(params: Omit<PostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.mine, params],
    queryFn: ({ pageParam }) =>
      postService.getMyPosts({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
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
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: (id: string) => postService.publishPost(id),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: (id: string) => postService.closePost(id),
    onSuccess: invalidate,
  });

  // Alias để các page cũ không cần đổi tên gọi
  return {
    create,
    update,
    remove,
    publish,
    close,
    createPost: create,
    updatePost: update,
  };
}
