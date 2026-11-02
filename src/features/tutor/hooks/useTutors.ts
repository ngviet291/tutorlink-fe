import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { tutorService } from '../service/tutor.service'
import type { TutorFilter, TutorProfilePayload } from '../types/tutor.types'

export function useTutors(params: Omit<TutorFilter, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.tutors.list(params),
    queryFn: ({ pageParam }) =>
      tutorService.getTutors({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  })
}

export function useTutor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tutors.detail(id ?? ''),
    queryFn: () => tutorService.getTutorById(id ?? ''),
    enabled: Boolean(id),
    retry: false,
  })
}

export function useMyTutorProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tutors.me,
    queryFn: tutorService.getMyProfile,
    enabled,
  })
}

export function useSaveTutorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: TutorProfilePayload) => tutorService.saveMyProfile(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tutors.all }),
  })
}
