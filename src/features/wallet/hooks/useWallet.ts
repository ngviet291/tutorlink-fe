import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { walletService } from '../service/wallet.service'
import type { TransactionFilter } from '../types/wallet.types'

export function useWallet(enabled = true) {
  return useQuery({ queryKey: queryKeys.wallet.balance, queryFn: walletService.getWallet, enabled })
}

export function useTransactions(params: TransactionFilter, enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: () => walletService.getTransactions(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFeeQuote(applicationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.quote(applicationId ?? ''),
    queryFn: () => walletService.getFeeQuote(applicationId ?? ''),
    enabled: Boolean(applicationId),
  })
}

export function useWalletMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['wallet'] })
  return {
    topUp: useMutation({ mutationFn: (amount: number) => walletService.topUp(amount), onSuccess: refresh }),
    confirmTopUp: useMutation({ mutationFn: (id: string) => walletService.confirmTopUp(id), onSuccess: refresh }),
  }
}
