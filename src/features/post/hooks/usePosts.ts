import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { postService } from '../service/post.service'
import type { PostFilter, PostPayload } from '../types/post.types'

export function usePosts(params: Omit<PostFilter, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: ({ pageParam }) =>
      postService.getPosts({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  })
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id ?? ''),
    queryFn: () => postService.getPostById(id ?? ''),
    enabled: Boolean(id),
    retry: false,
  })
}

export function useMyPosts() {
  return useQuery({ queryKey: queryKeys.posts.mine, queryFn: postService.getMyPosts })
}

export function usePostMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.posts.all })
  const create = useMutation({
    mutationFn: (v: { payload: PostPayload; asDraft: boolean }) => postService.createPost(v.payload, v.asDraft),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; payload: PostPayload }) => postService.updatePost(v.id, v.payload),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onSuccess: invalidate,
  })
  const publish = useMutation({
    mutationFn: (id: string) => postService.publishPost(id),
    onSuccess: invalidate,
  })
  const close = useMutation({
    mutationFn: (id: string) => postService.closePost(id),
    onSuccess: invalidate,
  })
  // createPost / updatePost: tên gọi khác của create / update (các page đang dùng)
  return { create, update, remove, publish, close, createPost: create, updatePost: update }
}
