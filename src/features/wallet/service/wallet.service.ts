import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError, type PageResponse } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type {
  EnrollmentFeeQuote, TopUpResponse, TransactionFilter, TransactionResponse, WalletResponse,
} from '../types/wallet.types'
import { applications, nextId, transactions, wallets } from '@/mocks/db'
import { delay, paginate, requireUser } from '@/mocks/session'
import { quoteFor } from '@/mocks/fee'

const USE_MOCK = env.useMock

export const walletService = {
  async getWallet(): Promise<WalletResponse> {
    if (USE_MOCK) {
      await delay(250)
      const me = requireUser()
      return { balance: wallets[me.id] ?? 0 }
    }
    return http.get<WalletResponse>('/v1/wallet')
  },

  /** Tạo yêu cầu nạp (PENDING) + hướng dẫn chuyển khoản. Ví chỉ nạp và trả phí, KHÔNG rút tiền. */
  async topUp(amount: number): Promise<TopUpResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      if (!Number.isFinite(amount) || amount < 10000) throw new ApiError('Số tiền nạp tối thiểu 10.000đ', 'INVALID_AMOUNT', 400)
      const tx = {
        id: nextId('tx'), type: 'TOP_UP' as const, amount, status: 'PENDING' as const,
        createdAt: new Date().toISOString(), tutorId: me.id, tutorName: me.fullName,
      }
      transactions.unshift(tx)
      return {
        transaction: tx, transferCode: `TL${tx.id.replace(/\D/g, '')}`,
        bankName: 'Ngân hàng Demo (MOCK)', accountNumber: '0123456789', accountName: 'CONG TY TUTORLINK',
      }
    }
    return http.post<TopUpResponse>('/v1/wallet/top-up', { amount })
  },

  /** Mock: giả lập ngân hàng xác nhận khi người dùng bấm "Tôi đã chuyển khoản". */
  async confirmTopUp(transactionId: string): Promise<TransactionResponse> {
    if (USE_MOCK) {
      await delay(800)
      const me = requireUser()
      const tx = transactions.find((t) => t.id === transactionId && t.tutorId === me.id)
      if (!tx) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (tx.status === 'PENDING') {
        tx.status = 'SUCCESS'
        wallets[me.id] = (wallets[me.id] ?? 0) + tx.amount
      }
      return tx
    }
    // TODO: nối API — thực tế backend tự xác nhận qua webhook ngân hàng; FE chỉ cần refetch
    return http.get<TransactionResponse>(`/v1/wallet/transactions/${transactionId}`)
  },

  async getTransactions(params: TransactionFilter = {}): Promise<PageResponse<TransactionResponse>> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const mine = transactions
        .filter((t) => t.tutorId === me.id)
        .filter((t) => !params.status || t.status === params.status)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      return paginate(mine, params.page, params.pageSize ?? 10)
    }
    return http.get<PageResponse<TransactionResponse>>('/v1/wallet/transactions', { params })
  },

  /** Báo giá phí nhận lớp = tỉ lệ (Admin cấu hình) × học phí dự kiến tháng đầu. */
  async getFeeQuote(applicationId: string): Promise<EnrollmentFeeQuote> {
    if (USE_MOCK) {
      await delay(200)
      const a = applications.find((x) => x.id === applicationId)
      if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      return quoteFor(a)
    }
    return http.get<EnrollmentFeeQuote>(`/v1/applications/${applicationId}/fee-quote`) // TODO: nối API
  },
}
