// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@/shared/types/common.types";

/** BE: payment/dto/request/CreateFeeConfigRequest.java */
export interface CreateFeeConfigRequest {
  feePercentage: number;
  fixedFee?: number;
  effectiveFrom?: string;
}

/** BE: payment/dto/request/TopUpRequest.java */
export interface TopUpRequest {
  amount: number;
}

/** BE: payment/dto/response/FeeConfigResponse.java */
export interface FeeConfigResponse {
  id: string;
  feePercentage: number;
  fixedFee: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdByAdminId?: string;
  createdAt: string;
}

/** BE: payment/dto/response/RevenueStatisticsResponse.java */
export interface RevenueStatisticsResponse {
  from: string;
  to: string;
  totalRevenue: number;
  totalRefunded: number;
  totalTopUp: number;
  successCount: number;
  failedCount: number;
  refundedCount: number;
  topUpCount: number;
  totalTransactions: number;
}

/** BE: payment/dto/response/TransactionResponse.java */
export interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  transactionDate: string;
  tutorId?: string;
  applicationId?: string;
  providerOrderId?: string;
  providerTransId?: string;
  paymentLink?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

/** BE: payment/dto/response/WalletBalanceResponse.java */
export interface WalletBalanceResponse {
  walletId: string;
  balance: number;
}
export interface FeeQuoteResponse {
  applicationId: string;
  baseAmount: number;
  feeRate: number;
  feeAmount: number;
}
