import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { TransactionResponse as BeTransaction, FeeConfigResponse } from "@/features/wallet/types/payment.dto";
import type { AdminTransactionFilter, TransactionResponse, RevenueStatistics } from "@/features/wallet/types/wallet.types";
import { fromBeTransaction, walletService } from "@/features/wallet/service/wallet.service";
import type { FeeRateConfig, FeeRatePayload } from "../types/admin.types";

export function mapFeeConfig(dto: FeeConfigResponse, today = new Date().toLocaleDateString('en-CA')): FeeRateConfig {
  return { id: dto.id, rate: Number(dto.feePercentage), fixedFee: Number(dto.fixedFee),
    effectiveFrom: dto.effectiveFrom, effectiveTo: dto.effectiveTo, createdBy: dto.createdByAdminId ?? '—',
    active: dto.effectiveFrom <= today && (!dto.effectiveTo || dto.effectiveTo >= today) };
}
export const adminPaymentService = {
  async getTransactions(params: AdminTransactionFilter = {}): Promise<CursorResponse<TransactionResponse>> {
    const { data } = await http.get<CursorResponse<BeTransaction>>("/v1/payments", {
      params: { status: params.status || undefined, cursor: params.cursor, limit: params.limit ?? 10 } });
    return { ...data, content: data.content.map(fromBeTransaction) };
  },
  getTransaction: walletService.getTransaction,
  async getFeeRates(): Promise<FeeRateConfig[]> {
    const all: FeeRateConfig[] = []; const seen = new Set<string>(); let cursor: string | undefined;
    for (;;) {
      const { data }: { data: CursorResponse<FeeConfigResponse> } = await http.get("/v1/payments/fee-configs", { params: { cursor, limit: 50 } });
      all.push(...data.content.map(dto => mapFeeConfig(dto)));
      if (!data.hasNext) return all;
      if (!data.nextCursor || seen.has(data.nextCursor)) throw new Error('Không thể tải tiếp lịch sử cấu hình phí.');
      cursor = data.nextCursor; seen.add(cursor);
    }
  },
  async createFeeRate(payload: FeeRatePayload): Promise<FeeRateConfig> {
    const { data } = await http.post<FeeConfigResponse>("/v1/payments/fee-configs", {
      feePercentage: payload.ratePercent / 100, fixedFee: payload.fixedFee ?? 0, effectiveFrom: payload.effectiveFrom });
    return mapFeeConfig(data);
  },
  async refundTransaction(id: string): Promise<TransactionResponse> {
    return fromBeTransaction((await http.post<BeTransaction>(`/v1/payments/${id}/refund`)).data);
  },
  async getRevenueStatistics(range: { from?: string; to?: string } = {}): Promise<RevenueStatistics> {
    return (await http.get<RevenueStatistics>("/v1/payments/statistics/revenue", { params: range })).data;
  },
};
