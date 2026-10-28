import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { reviewService } from '../service/review.service'
import type { ReviewPayload } from '../types/review.types'

export function useTutorReviews(tutorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.byTutor(tutorId ?? ''),
    queryFn: () => reviewService.getReviewsByTutor(tutorId ?? ''),
    enabled: Boolean(tutorId),
  })
}

export function useHasReviewed(applicationId: string) {
  return useQuery({
    queryKey: ['reviews', 'has', applicationId],
    queryFn: () => reviewService.hasReviewed(applicationId),
  })
}

export function useReviewMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['reviews'] })
  return {
    create: useMutation({
      mutationFn: (p: ReviewPayload) => reviewService.createReview(p),
      onSuccess: async () => {
        await refresh()
        await qc.invalidateQueries({ queryKey: queryKeys.tutors.all })
      },
    }),
    complain: useMutation({
      mutationFn: (v: { reviewId: string; reason: string }) => reviewService.submitComplaint(v.reviewId, v.reason),
      onSuccess: refresh,
    }),
  }
}
