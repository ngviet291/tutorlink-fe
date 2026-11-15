import type { IHttpClient } from "@/config/http/IHttpClient";
import type { CursorResponse } from "@/shared/types/api.types";
import {
  PAYMENT_API_PATH,
  PAYMENT_REQUEST_TIMEOUT_MS,
} from "../constants/payment.constants";
import { fromBeTransaction } from "../mapper/payment.mapper";
import type { TransactionResponse as TransactionDto } from "../types/payment.dto";
import type {
  EnrollmentFeeQuote,
  TopUpPayload,
  TopUpResponse,
  TransactionFilter,
  TransactionResponse,
  WalletResponse,
} from "../types/wallet.types";
import type { WalletGateway } from "./wallet.gateway";

/** Chỉ lớp này biết đường dẫn và cách gửi yêu cầu HTTP của ví. */
export class HttpWalletGateway implements WalletGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async confirmDemoTopUp(id: string): Promise<TransactionResponse> {
    const dto = await this.http.post<TransactionDto>(
      `${PAYMENT_API_PATH}/demo/top-up/${id}/confirm`,
    );
    return fromBeTransaction(dto);
  }

  async getWallet(): Promise<WalletResponse> {
    const dto = await this.http.get<WalletResponse>(`${PAYMENT_API_PATH}/wallet/balance`);
    return { balance: Number(dto.balance) };
  }

  async topUp(payload: TopUpPayload): Promise<TopUpResponse> {
    const dto = await this.http.post<TransactionDto>(
      `${PAYMENT_API_PATH}/wallet/top-up`,
      { amount: payload.amount },
      { timeout: PAYMENT_REQUEST_TIMEOUT_MS },
    );
    return {
      transaction: fromBeTransaction(dto),
      paymentLink: dto.paymentLink,
      qrCodeUrl: dto.qrCodeUrl,
      deeplink: dto.deeplink,
    };
  }

  async getTransaction(id: string): Promise<TransactionResponse> {
    const dto = await this.http.get<TransactionDto>(`${PAYMENT_API_PATH}/${id}`);
    return fromBeTransaction(dto);
  }

  async getTopUpStatus(id: string): Promise<TransactionResponse> {
    const dto = await this.http.get<TransactionDto>(
      `${PAYMENT_API_PATH}/wallet/top-up/${id}`,
      { timeout: PAYMENT_REQUEST_TIMEOUT_MS },
    );
    return fromBeTransaction(dto);
  }

  async getTransactions(
    params: TransactionFilter = {},
  ): Promise<CursorResponse<TransactionResponse>> {
    const page = await this.http.get<CursorResponse<TransactionDto>>(
      `${PAYMENT_API_PATH}/history`,
      { params: { cursor: params.cursor, limit: params.limit } },
    );
    return { ...page, content: page.content.map(fromBeTransaction) };
  }

  async getFeeQuote(applicationId: string): Promise<EnrollmentFeeQuote> {
    const dto = await this.http.get<EnrollmentFeeQuote>(
      `${PAYMENT_API_PATH}/applications/${applicationId}/fee-quote`,
    );
    return {
      applicationId,
      baseAmount: Number(dto.baseAmount),
      feeRate: Number(dto.feeRate),
      feeAmount: Number(dto.feeAmount),
    };
  }

  async payCommission(applicationId: string): Promise<TransactionResponse> {
    const dto = await this.http.post<TransactionDto>(
      `${PAYMENT_API_PATH}/applications/${applicationId}/pay`,
    );
    return fromBeTransaction(dto);
  }
}
