import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { applicationService } from '../service/application.service'
import type { ApplyPayload } from '../types/application.types'

export function useMyApplications(enabled = true) {
  return useQuery({ queryKey: queryKeys.applications.mine, queryFn: applicationService.getMyApplications, enabled })
}

export function useConnections(enabled = true) {
  return useQuery({ queryKey: [...queryKeys.applications.all, 'connections'], queryFn: applicationService.getConnections, enabled })
}

export function useApplicationsByPost(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.applications.byPost(postId),
    queryFn: () => applicationService.getApplicationsByPost(postId),
    enabled,
  })
}

export function useAiTop5(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.applications.aiTop5(postId),
    queryFn: () => applicationService.getAiTop5(postId),
    enabled,
    retry: false,
    staleTime: 30_000,
  })
}

export function useApplicationMutations() {
  const qc = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.applications.all }),
      qc.invalidateQueries({ queryKey: queryKeys.posts.all }),
      qc.invalidateQueries({ queryKey: queryKeys.wallet.balance }),
      qc.invalidateQueries({ queryKey: ['wallet'] }),
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ])
  }
  return {
    apply: useMutation({ mutationFn: (p: ApplyPayload) => applicationService.applyToPost(p), onSuccess: refresh }),
    select: useMutation({ mutationFn: (id: string) => applicationService.selectApplicant(id), onSuccess: refresh }),
    pay: useMutation({ mutationFn: (id: string) => applicationService.confirmAndPayFee(id), onSuccess: refresh }),
    decline: useMutation({ mutationFn: (id: string) => applicationService.declineOffer(id), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (id: string) => applicationService.cancelApplication(id), onSuccess: refresh }),
  }
}
