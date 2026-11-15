import { useEffect } from "react";
import { TOP_UP_POLL_INTERVAL_MS } from "../constants/payment.constants";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { walletService } from "@/config/di/container";
import type { TopUpPayload, TransactionFilter } from "../types/wallet.types";

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: () => walletService.getWallet(),
    enabled,
  });
}

export function useTransactions(
  params: Omit<TransactionFilter, "cursor"> = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: ({ pageParam }) =>
      walletService.getTransactions({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
    enabled,
  });
}

export function useFeeQuote(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallet.quote(applicationId),
    queryFn: () => walletService.getFeeQuote(applicationId),
    enabled: enabled && Boolean(applicationId),
  });
}

export function useTopUp() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
  return useMutation({
    mutationFn: (payload: TopUpPayload) => walletService.topUp(payload),
    onSuccess: refresh,
  });
}

export function useWalletMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
  return {
    payCommission: useMutation({
      mutationFn: (id: string) => walletService.payCommission(id),
      onSuccess: () => {
        void refresh();
        void qc.invalidateQueries({ queryKey: queryKeys.applications.all });
      },
    }),
    topUp: useMutation({
      mutationFn: (payload: TopUpPayload) => walletService.topUp(payload),
      onSuccess: refresh,
    }),
    confirmTopUp: useMutation({
      mutationFn: (id: string) => walletService.confirmTopUp(id),
      onSuccess: refresh,
    }),
  };
}

/** Theo dõi trạng thái qua API; chỉ làm mới số dư khi giao dịch thành công. */
export function useTopUpStatus(id: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.wallet.topUpStatus(id),
    queryFn: () => walletService.getTopUpStatus(id!),
    enabled: enabled && Boolean(id),
    retry: false,
    refetchInterval: (current) => {
      const isSettled =
        current.state.data && current.state.data.transactionStatus !== "PENDING";
      return current.state.status === "error" || isSettled
        ? false
        : TOP_UP_POLL_INTERVAL_MS;
    },
  });

  useEffect(() => {
    if (query.data?.transactionStatus === "SUCCESS") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    }
  }, [query.data?.transactionStatus, queryClient]);

  return query;
}

export function useDemoTopUpConfirmation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => walletService.confirmDemoTopUp(id),
    onSuccess: (transaction) => {
      queryClient.setQueryData(queryKeys.wallet.topUpStatus(transaction.id), transaction);
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
}
