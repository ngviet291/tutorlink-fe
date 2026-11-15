import type { AdminTransactionFilter } from "@/features/wallet/types/wallet.types";
import type { AdminPaymentGateway, RevenueRange } from "../api/admin.payment.gateway";
import type { FeeRateConfig, FeeRatePayload } from "../types/admin.types";

/** Xử lý nghiệp vụ quản trị thanh toán; không phụ thuộc chi tiết HTTP. */
export class AdminPaymentService {
  private readonly gateway: AdminPaymentGateway;

  constructor(gateway: AdminPaymentGateway) {
    this.gateway = gateway;
  }

  getTransactions(params: AdminTransactionFilter = {}) {
    return this.gateway.getTransactions(params);
  }

  getTransaction(id: string) {
    return this.gateway.getTransaction(id);
  }

  async getFeeRates(): Promise<FeeRateConfig[]> {
    const all: FeeRateConfig[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;

    for (;;) {
      const page = await this.gateway.getFeeConfigPage(cursor);
      all.push(...page.content);

      if (!page.hasNext) {
        return all;
      }

      if (!page.nextCursor || seen.has(page.nextCursor)) {
        throw new Error("Không thể tải tiếp lịch sử cấu hình phí.");
      }

      cursor = page.nextCursor;
      seen.add(cursor);
    }
  }

  createFeeRate(payload: FeeRatePayload) {
    return this.gateway.createFeeRate(payload);
  }

  refundTransaction(id: string) {
    return this.gateway.refundTransaction(id);
  }

  getRevenueStatistics(range: RevenueRange = {}) {
    return this.gateway.getRevenueStatistics(range);
  }
}
