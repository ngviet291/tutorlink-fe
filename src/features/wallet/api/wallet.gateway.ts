import type { CursorResponse } from "@/shared/types/api.types";
import type {
  EnrollmentFeeQuote,
  TopUpPayload,
  TopUpResponse,
  TransactionFilter,
  TransactionResponse,
  WalletResponse,
} from "../types/wallet.types";

export interface TransactionQueryGateway {
  getTransaction(id: string): Promise<TransactionResponse>;
}

export interface WalletGateway extends TransactionQueryGateway {
  confirmDemoTopUp(id: string): Promise<TransactionResponse>;
  getWallet(): Promise<WalletResponse>;
  topUp(payload: TopUpPayload): Promise<TopUpResponse>;
  getTopUpStatus(id: string): Promise<TransactionResponse>;
  getTransactions(
    params?: TransactionFilter,
  ): Promise<CursorResponse<TransactionResponse>>;
  getFeeQuote(applicationId: string): Promise<EnrollmentFeeQuote>;
  payCommission(applicationId: string): Promise<TransactionResponse>;
}
