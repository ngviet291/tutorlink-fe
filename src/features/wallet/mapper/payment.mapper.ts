import type { TransactionResponse as TransactionDto } from "../types/payment.dto";
import type { TransactionResponse } from "../types/wallet.types";

/** Chuyển dữ liệu giao dịch từ API sang mô hình hiển thị. */
export function fromBeTransaction(dto: TransactionDto): TransactionResponse {
  return {
    id: dto.id,
    transactionType: dto.type,
    amount: Number(dto.amount),
    transactionStatus: dto.status,
    paymentMethod: dto.paymentMethod,
    createdAt: dto.transactionDate,
    tutorId: dto.tutorId,
    applicationId: dto.applicationId,
    providerOrderId: dto.providerOrderId,
    providerTransId: dto.providerTransId,
    paymentLink: dto.paymentLink,
    qrCodeUrl: dto.qrCodeUrl,
    deeplink: dto.deeplink,
  };
}
