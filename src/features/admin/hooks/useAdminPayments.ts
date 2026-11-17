import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminPaymentService } from "@/config/di/container";
import { queryKeys } from "@/constants/queryKeys";
import type { AdminTransactionFilter } from "@/features/wallet/types/wallet.types";
import type { FeeRatePayload } from "../types/admin.types";

export const adminPaymentKeys = {
  all: ["admin"] as const,
  transactions: ["admin", "transactions"] as const,
  feeRates: ["admin", "fee-rates"] as const,
};

export function useAdminTransactions(
  params: Omit<AdminTransactionFilter, "cursor"> = {},
) {
  return useInfiniteQuery({
    queryKey: [...adminPaymentKeys.transactions, "list", params],
    queryFn: ({ pageParam }) =>
      adminPaymentService.getTransactions({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : undefined),
  });
}
export function useAdminTransaction(id: string | undefined) {
  return useQuery({
    queryKey: [...adminPaymentKeys.transactions, "detail", id],
    queryFn: () => adminPaymentService.getTransaction(id!),
    enabled: Boolean(id),
  });
}

export function useFeeRates() {
  return useQuery({
    queryKey: adminPaymentKeys.feeRates,
    queryFn: () => adminPaymentService.getFeeRates(),
  });
}

export function useRevenueStatistics(range: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...adminPaymentKeys.transactions, "revenue", range],
    queryFn: () => adminPaymentService.getRevenueStatistics(range),
    // Chỉ gọi API khi CẢ HAI ngày đều có giá trị
    enabled: Boolean(range.from && range.to && range.from <= range.to),
  });
}

export function useAdminPaymentMutations() {
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
  };

  const refundTransaction = useMutation({
    mutationFn: (id: string) => adminPaymentService.refundTransaction(id),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });

  const createFeeRate = useMutation({
    mutationFn: (payload: FeeRatePayload) => adminPaymentService.createFeeRate(payload),
    onSuccess: refresh,
  });

  const approveWithdrawal = useMutation({
    mutationFn: (id: string) => adminPaymentService.approveWithdrawal(id),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });

  const rejectWithdrawal = useMutation({
    mutationFn: (id: string) => adminPaymentService.rejectWithdrawal(id),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });

  return { 
    refundTransaction, 
    createFeeRate, 
    approveWithdrawal, 
    rejectWithdrawal 
  };
}
