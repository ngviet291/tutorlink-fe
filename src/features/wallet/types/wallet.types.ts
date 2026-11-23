import type {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@/shared/types/common.types";

export interface WalletResponse {
  balance: number;
}

export interface WithdrawalBankDetails {
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
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
  tutorName?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  bankAccountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
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
  type?: TransactionType | "";
  cursor?: string;
  limit?: number;
}

export interface TopUpPayload {
  amount: number;
  /** BE bắt buộc: VIETQR. */
  paymentMethod: Extract<PaymentMethod, "VIETQR">;
}

export interface TopUpResponse {
  transaction: TransactionResponse;
  /** VietQR: paymentLink là ảnh QR, qrCodeUrl là nội dung QR để tự vẽ. */
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
