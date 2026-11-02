import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { walletService } from '../service/wallet.service'
import type { TopUpPayload, TransactionFilter } from '../types/wallet.types'

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: walletService.getWallet,
    enabled,
  })
}

export function useTransactions(params: Omit<TransactionFilter, 'cursor'> = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: ({ pageParam }) =>
      walletService.getTransactions({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    enabled,
  })
}

export function useFeeQuote(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet.quote(applicationId),
    queryFn: () => walletService.getFeeQuote(applicationId),
    enabled: enabled && Boolean(applicationId),
  })
}

export function useTopUp() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
  return useMutation({
    mutationFn: (payload: TopUpPayload) => walletService.topUp(payload),
    onSuccess: refresh,
  })
}

export function useWalletMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
  return {
    topUp: useMutation({
      mutationFn: (payload: TopUpPayload) => walletService.topUp(payload),
      onSuccess: refresh,
    }),
    confirmTopUp: useMutation({
      mutationFn: (id: string) => walletService.confirmTopUp(id),
      onSuccess: refresh,
    }),
  }
}
