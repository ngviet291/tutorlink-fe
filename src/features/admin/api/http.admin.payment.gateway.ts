import type { IHttpClient } from "@/config/http/IHttpClient";
import type { CursorResponse } from "@/shared/types/api.types";
import {
  FEE_CONFIG_PAGE_SIZE,
  PAYMENT_API_PATH,
  PAYMENT_PAGE_SIZE,
} from "@/features/wallet/constants/payment.constants";
import { fromBeTransaction } from "@/features/wallet/mapper/payment.mapper";
import type {
  TransactionResponse as TransactionDto,
  FeeConfigResponse,
} from "@/features/wallet/types/payment.dto";
import type {
  AdminTransactionFilter,
  RevenueStatistics,
} from "@/features/wallet/types/wallet.types";
import { mapFeeConfig, toFeeConfigRequest } from "../mapper/admin.payment.mapper";
import type { FeeRatePayload } from "../types/admin.types";
import type { AdminPaymentGateway, RevenueRange } from "./admin.payment.gateway";

export class HttpAdminPaymentGateway implements AdminPaymentGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getTransactions(params: AdminTransactionFilter = {}) {
    const page = await this.http.get<CursorResponse<TransactionDto>>(PAYMENT_API_PATH, {
      params: {
        status: params.status || undefined,
        type: params.type || undefined,
        cursor: params.cursor,
        limit: params.limit ?? PAYMENT_PAGE_SIZE,
      },
    });
    return { ...page, content: page.content.map(fromBeTransaction) };
  }

  async getTransaction(id: string) {
    const dto = await this.http.get<TransactionDto>(`${PAYMENT_API_PATH}/${id}`);
    return fromBeTransaction(dto);
  }

  async getFeeConfigPage(cursor?: string) {
    const page = await this.http.get<CursorResponse<FeeConfigResponse>>(
      `${PAYMENT_API_PATH}/fee-configs`,
      { params: { cursor, limit: FEE_CONFIG_PAGE_SIZE } },
    );
    return {
      ...page,
      content: page.content.map((dto) => mapFeeConfig(dto)),
    };
  }

  async createFeeRate(payload: FeeRatePayload) {
    const dto = await this.http.post<FeeConfigResponse>(
      `${PAYMENT_API_PATH}/fee-configs`,
      toFeeConfigRequest(payload),
    );
    return mapFeeConfig(dto);
  }

  async refundTransaction(id: string) {
    const dto = await this.http.post<TransactionDto>(`${PAYMENT_API_PATH}/${id}/refund`);
    return fromBeTransaction(dto);
  }

  getRevenueStatistics(range: RevenueRange = {}) {
    return this.http.get<RevenueStatistics>(`${PAYMENT_API_PATH}/statistics/revenue`, {
      params: range,
    });
  }

  async approveWithdrawal(id: string) {
    const dto = await this.http.post<TransactionDto>(
      `${PAYMENT_API_PATH}/${id}/approve-withdrawal`,
    );
    return fromBeTransaction(dto);
  }

  async rejectWithdrawal(id: string) {
    const dto = await this.http.post<TransactionDto>(
      `${PAYMENT_API_PATH}/${id}/reject-withdrawal`,
    );
    return fromBeTransaction(dto);
  }
}
