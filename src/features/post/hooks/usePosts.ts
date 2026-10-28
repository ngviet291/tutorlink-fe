import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { postService } from '../service/post.service'
import type { PostFilter, PostPayload } from '../types/post.types'

export function usePosts(params: PostFilter) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postService.getPosts(params),
    placeholderData: keepPreviousData,
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
  return {
    create: useMutation({
      mutationFn: (v: { payload: PostPayload; asDraft: boolean }) => postService.createPost(v.payload, v.asDraft),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; payload: PostPayload }) => postService.updatePost(v.id, v.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => postService.deletePost(id), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: (id: string) => postService.publishPost(id), onSuccess: invalidate }),
  }
}
