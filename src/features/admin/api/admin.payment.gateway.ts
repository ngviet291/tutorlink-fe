import type { CursorResponse } from "@/shared/types/api.types";
import type { TransactionQueryGateway } from "@/features/wallet/api/wallet.gateway";
import type {
  AdminTransactionFilter,
  RevenueStatistics,
  TransactionResponse,
} from "@/features/wallet/types/wallet.types";
import type { FeeRateConfig, FeeRatePayload } from "../types/admin.types";

export interface RevenueRange {
  from?: string;
  to?: string;
}

export interface AdminPaymentGateway extends TransactionQueryGateway {
  getTransactions(
    params?: AdminTransactionFilter,
  ): Promise<CursorResponse<TransactionResponse>>;
  getFeeConfigPage(cursor?: string): Promise<CursorResponse<FeeRateConfig>>;
  createFeeRate(payload: FeeRatePayload): Promise<FeeRateConfig>;
  refundTransaction(id: string): Promise<TransactionResponse>;
  getRevenueStatistics(range?: RevenueRange): Promise<RevenueStatistics>;
}
