import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { TransactionResponse as BeTransaction } from "../types/payment.dto";
import type { EnrollmentFeeQuote, TopUpPayload, TopUpResponse, TransactionFilter, TransactionResponse, WalletResponse } from "../types/wallet.types";

export function fromBeTransaction(t: BeTransaction): TransactionResponse {
  return { id: t.id, transactionType: t.type, amount: Number(t.amount),
    transactionStatus: t.status, paymentMethod: t.paymentMethod, createdAt: t.transactionDate,
    tutorId: t.tutorId, applicationId: t.applicationId, providerOrderId: t.providerOrderId,
    providerTransId: t.providerTransId, paymentLink: t.paymentLink, qrCodeUrl: t.qrCodeUrl, deeplink: t.deeplink };
}
export const walletService = {
  // Endpoint chỉ tồn tại khi backend bật cờ payment.demo.enabled=true cho phát triển.
  async confirmDemoTopUp(id: string): Promise<TransactionResponse> {
    return fromBeTransaction((await http.post<BeTransaction>(`/v1/payments/demo/top-up/${id}/confirm`)).data);
  },
  async getWallet(): Promise<WalletResponse> {
    const { data } = await http.get<WalletResponse>("/v1/payments/wallet/balance");
    return { balance: Number(data.balance) };
  },
  async topUp(payload: TopUpPayload): Promise<TopUpResponse> {
    const { data } = await http.post<BeTransaction>("/v1/payments/wallet/top-up", { amount: payload.amount }, { timeout: 45000 });
    return { transaction: fromBeTransaction(data), paymentLink: data.paymentLink, qrCodeUrl: data.qrCodeUrl, deeplink: data.deeplink };
  },
  async getTransaction(id: string): Promise<TransactionResponse> {
    return fromBeTransaction((await http.get<BeTransaction>(`/v1/payments/${id}`)).data);
  },
  async getTopUpStatus(id: string): Promise<TransactionResponse> {
    return fromBeTransaction((await http.get<BeTransaction>(`/v1/payments/wallet/top-up/${id}`, { timeout: 45000 })).data);
  },
  async confirmTopUp(id: string): Promise<TransactionResponse> {
    return walletService.getTopUpStatus(id);
  },
  async getTransactions(params: TransactionFilter = {}): Promise<CursorResponse<TransactionResponse>> {
    const { data } = await http.get<CursorResponse<BeTransaction>>("/v1/payments/history", { params: { cursor: params.cursor, limit: params.limit } });
    return { ...data, content: data.content.map(fromBeTransaction) };
  },
  async getFeeQuote(applicationId: string): Promise<EnrollmentFeeQuote> {
    const { data } = await http.get<Omit<EnrollmentFeeQuote, "applicationId">>(`/v1/payments/applications/${applicationId}/fee-quote`);
    return { applicationId, baseAmount: Number(data.baseAmount), feeRate: Number(data.feeRate), feeAmount: Number(data.feeAmount) };
  },
  async payCommission(applicationId: string): Promise<TransactionResponse> {
    return fromBeTransaction((await http.post<BeTransaction>(`/v1/payments/applications/${applicationId}/pay`)).data);
  },
};
