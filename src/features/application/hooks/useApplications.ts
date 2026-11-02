import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { applicationService } from '../service/application.service'

export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.mine,
    queryFn: applicationService.getMyApplications,
    enabled,
  })
}

export function useConnections(enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.connections,
    queryFn: applicationService.getConnections,
    enabled,
  })
}

export function useApplicationsByPost(postId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.byPost(postId),
    queryFn: () => applicationService.getApplicationsByPost(postId),
    enabled: enabled && Boolean(postId),
  })
}

export function useAiTop5(postId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.aiTop5(postId),
    queryFn: () => applicationService.getAiTop5(postId),
    enabled: enabled && Boolean(postId),
    retry: false,
  })
}

export function useApplicationMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.applications.all })
    void qc.invalidateQueries({ queryKey: queryKeys.posts.all })
    void qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
  }

  return {
    apply: useMutation({
      mutationFn: applicationService.applyToPost,
      onSuccess: invalidate,
    }),
    select: useMutation({
      mutationFn: (id: string) => applicationService.selectApplicant(id),
      onSuccess: invalidate,
    }),
    pay: useMutation({
      mutationFn: (id: string) => applicationService.confirmAndPayFee(id),
      onSuccess: invalidate,
    }),
    confirm: useMutation({
      mutationFn: (id: string) => applicationService.confirmApplication(id),
      onSuccess: invalidate,
    }),
    finish: useMutation({
      mutationFn: (id: string) => applicationService.finishApplication(id),
      onSuccess: invalidate,
    }),
    decline: useMutation({
      mutationFn: (id: string) => applicationService.declineOffer(id),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: (id: string) => applicationService.cancelApplication(id),
      onSuccess: invalidate,
    }),
  }
}
