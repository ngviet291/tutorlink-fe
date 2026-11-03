import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { ApiError, type CursorResponse } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  EnrollmentFeeQuote,
  TopUpPayload,
  TopUpResponse,
  TransactionFilter,
  TransactionResponse,
  WalletResponse,
} from "../types/wallet.types";
import { applications, nextId, transactions, wallets } from "@/mocks/db";
import { cursorPaginate, delay, requireUser } from "@/mocks/session";
import { quoteFor } from "@/mocks/fee";

const USE_MOCK = mockConfig.wallet;

/** TransactionResponse của BE → dạng FE dùng. */
interface BeTransaction {
  id: string;
  type: TransactionResponse["transactionType"];
  amount: number;
  status: TransactionResponse["transactionStatus"];
  paymentMethod?: TransactionResponse["paymentMethod"];
  transactionDate: string;
  tutorId?: string;
  applicationId?: string;
  paymentLink?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}
export function fromBeTransaction(t: BeTransaction): TransactionResponse {
  return {
    id: t.id,
    transactionType: t.type,
    amount: Number(t.amount),
    transactionStatus: t.status,
    paymentMethod: t.paymentMethod,
    createdAt: t.transactionDate,
    tutorId: t.tutorId,
    applicationId: t.applicationId,
  };
}

export const walletService = {
  async getWallet(): Promise<WalletResponse> {
    if (USE_MOCK) {
      await delay(250);
      const me = requireUser();
      return { balance: wallets[me.id] ?? 0 };
    }
    return http
      .get<{ balance: number }>("/v1/payments/wallet/balance")
      .then((res) => ({ balance: Number(res.data.balance) }));
  },

  async topUp(payload: TopUpPayload): Promise<TopUpResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      if (
        !Number.isFinite(payload.amount) ||
        payload.amount < 1_000 ||
        payload.amount > 50_000_000
      ) {
        throw new ApiError(
          "Số tiền nạp phải từ 1.000đ đến 50.000.000đ.",
          "INVALID_AMOUNT",
          400,
        );
      }
      const tx: TransactionResponse = {
        id: nextId("tx"),
        transactionType: "TOP_UP",
        amount: payload.amount,
        transactionStatus: "PENDING",
        paymentMethod: payload.paymentMethod ?? "MOMO",
        tutorId: me.id,
        createdAt: new Date().toISOString(),
      };
      transactions.unshift(tx);
      return {
        transaction: tx,
        transferCode: `TL${tx.id.replace(/\D/g, "")}`,
        bankName: "Demo Bank (MOCK)",
        accountNumber: "0123456789",
        accountName: "CONG TY TUTORLINK",
        paymentLink: `https://test-payment.example/${payload.paymentMethod ?? "MOMO"}/${tx.id}`,
      };
    }
    const r = await http
      .post<BeTransaction>("/v1/payments/wallet/top-up", {
        amount: payload.amount,
        paymentMethod: payload.paymentMethod ?? "MOMO",
      })
      .then((res) => res.data);
    return {
      transaction: fromBeTransaction(r),
      transferCode: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      paymentLink: r.paymentLink,
      qrCodeUrl: r.qrCodeUrl,
      deeplink: r.deeplink,
    };
  },

  async confirmTopUp(transactionId: string): Promise<TransactionResponse> {
    if (USE_MOCK) {
      await delay(800);
      const me = requireUser();
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (tx.transactionStatus === "PENDING") {
        tx.transactionStatus = "SUCCESS";
        wallets[me.id] = (wallets[me.id] ?? 0) + tx.amount;
      }
      return tx;
    }
    return fromBeTransaction(
      await http
        .get<BeTransaction>(`/v1/payments/wallet/top-up/${transactionId}`)
        .then((res) => res.data),
    );
  },

  /** Trạng thái giao dịch nạp ví (dùng để poll sau khi chuyển sang cổng thanh toán). */
  async getTopUpStatus(transactionId: string): Promise<TransactionResponse> {
    if (USE_MOCK) {
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      return tx;
    }
    return fromBeTransaction(
      await http
        .get<BeTransaction>(`/v1/payments/wallet/top-up/${transactionId}`)
        .then((res) => res.data),
    );
  },

  async getTransactions(
    params: TransactionFilter = {},
  ): Promise<CursorResponse<TransactionResponse>> {
    if (USE_MOCK) {
      await delay();
      const list = transactions
        .filter(
          (t) =>
            !params.transactionStatus ||
            t.transactionStatus === params.transactionStatus,
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return cursorPaginate(
        list,
        params.cursor,
        (t) => t.id,
        params.limit ?? 10,
      );
    }
    const r = await http
      .get<CursorResponse<BeTransaction>>("/v1/payments/history", { params })
      .then((res) => res.data);
    return { ...r, items: r.items.map(fromBeTransaction) };
  },

  async getFeeQuote(applicationId: string): Promise<EnrollmentFeeQuote> {
    if (USE_MOCK) {
      await delay(200);
      const a = applications.find((x) => x.id === applicationId);
      if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      return quoteFor(a);
    }
    return http
      .get<EnrollmentFeeQuote>(`/v1/applications/${applicationId}/fee-quote`)
      .then((res) => res.data);
  },
};
