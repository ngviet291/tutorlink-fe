import type {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@/shared/types/common.types";

export interface WalletResponse {
  balance: number;
}

export interface TransactionResponse {
  id: string;
  transactionType: TransactionType;
  amount: number;
  transactionStatus: TransactionStatus;
  providerOrderId?: string;
  providerTransId?: string;
  paymentLink?: string;
  qrCodeUrl?: string;
  deeplink?: string;
  applicationId?: string;
  tutorId?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface EnrollmentFeeQuote {
  applicationId: string;
  baseAmount: number;
  feeRate: number;
  feeAmount: number;
}

export interface TransactionFilter {
  transactionStatus?: TransactionStatus | "";
  cursor?: string;
  limit?: number;
}

export interface AdminTransactionFilter {
  status?: TransactionStatus | "";
  tutorId?: string;
  page?: number;
  pageSize?: number;
}

export interface TopUpPayload {
  amount: number;
  paymentMethod?: PaymentMethod;
}

export interface TopUpResponse {
  transaction: TransactionResponse;
  transferCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  /** Cổng MoMo/ZaloPay trả về để chuyển hướng người dùng đi thanh toán */
  paymentLink?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

/** Thống kê doanh thu & vận hành (Admin). */
export interface RevenueStatistics {
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
