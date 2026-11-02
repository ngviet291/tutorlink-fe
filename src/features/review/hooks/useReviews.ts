import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { reviewService } from '../service/review.service'

export function useTutorReviews(tutorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.byTutor(tutorId ?? ''),
    queryFn: () => reviewService.getReviewsByTutor(tutorId ?? ''),
    enabled: Boolean(tutorId),
  })
}

export function useHasReviewed(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byApplication(applicationId),
    queryFn: () => reviewService.hasReviewed(applicationId),
    enabled: Boolean(applicationId),
  })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { applicationId: string; rating: number; comment?: string }) =>
      reviewService.createReview({ applicationId: v.applicationId, rating: v.rating, comment: v.comment ?? '' }),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.reviews.all })
      void qc.invalidateQueries({ queryKey: queryKeys.reviews.byApplication(vars.applicationId) })
      void qc.invalidateQueries({ queryKey: queryKeys.tutors.all })
    },
  })
}

export function useReviewMutations() {
  const qc = useQueryClient()
  return {
    complain: useMutation({
      mutationFn: (v: { reviewId: string; reason: string }) => reviewService.submitComplaint(v.reviewId, v.reason),
      onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
    }),
  }
}
