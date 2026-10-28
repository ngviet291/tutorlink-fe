import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { adminService } from '../service/admin.service'
import type { AccountStatus } from '@/shared/types/common.types'
import type { PostFilter } from '@/features/post/types/post.types'
import type { TransactionFilter } from '@/features/wallet/types/wallet.types'
import type { ComplaintDecisionPayload, FeeRatePayload, ProfileReviewPayload } from '../types/admin.types'

export const usePendingTutors = () =>
  useQuery({ queryKey: queryKeys.admin.pendingTutors, queryFn: adminService.getPendingTutors })

export const useAdminUsers = (params: { keyword?: string; page?: number }) =>
  useQuery({ queryKey: queryKeys.admin.users(params), queryFn: () => adminService.getUsers(params), placeholderData: keepPreviousData })

export const useAdminPosts = (params: PostFilter) =>
  useQuery({ queryKey: queryKeys.admin.posts(params), queryFn: () => adminService.getPosts(params), placeholderData: keepPreviousData })

export const useAdminTransactions = (params: TransactionFilter) =>
  useQuery({ queryKey: queryKeys.admin.transactions(params), queryFn: () => adminService.getTransactions(params), placeholderData: keepPreviousData })

export const useFeeRates = () => useQuery({ queryKey: queryKeys.admin.feeRates, queryFn: adminService.getFeeRates })
export const useComplaints = () => useQuery({ queryKey: queryKeys.admin.complaints, queryFn: adminService.getComplaints })
export const useAdminStats = () => useQuery({ queryKey: queryKeys.admin.stats, queryFn: adminService.getStats })

export function useAdminMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] })
  return {
    reviewTutor: useMutation({
      mutationFn: (v: { id: string; payload: ProfileReviewPayload }) => adminService.reviewTutor(v.id, v.payload),
      onSuccess: async () => {
        await refresh()
        await qc.invalidateQueries({ queryKey: queryKeys.tutors.all })
      },
    }),
    setUserStatus: useMutation({
      mutationFn: (v: { id: string; status: AccountStatus }) => adminService.setUserStatus(v.id, v.status),
      onSuccess: refresh,
    }),
    removePost: useMutation({
      mutationFn: (v: { id: string; reason: string }) => adminService.removePost(v.id, v.reason),
      onSuccess: async () => {
        await refresh()
        await qc.invalidateQueries({ queryKey: queryKeys.posts.all })
      },
    }),
    createFeeRate: useMutation({ mutationFn: (p: FeeRatePayload) => adminService.createFeeRate(p), onSuccess: refresh }),
    decideComplaint: useMutation({
      mutationFn: (v: { reviewId: string; payload: ComplaintDecisionPayload }) => adminService.decideComplaint(v.reviewId, v.payload),
      onSuccess: async () => {
        await refresh()
        await qc.invalidateQueries({ queryKey: ['reviews'] })
        await qc.invalidateQueries({ queryKey: queryKeys.tutors.all })
      },
    }),
  }
}
