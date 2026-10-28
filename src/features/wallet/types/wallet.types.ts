import type { TransactionStatus } from '@/shared/types/common.types'

export interface WalletResponse {
  balance: number
}

export interface TransactionResponse {
  id: string
  type: 'TOP_UP' | 'ENROLLMENT_FEE'
  amount: number
  status: TransactionStatus
  applicationId?: string
  tutorId?: string
  tutorName?: string
  createdAt: string
}

export interface EnrollmentFeeQuote {
  monthlyTuition: number
  feeRate: number
  feeAmount: number
}

export interface TransactionFilter {
  status?: TransactionStatus | ''
  tutorId?: string
  page?: number
  pageSize?: number
}

export interface TopUpResponse {
  transaction: TransactionResponse
  transferCode: string
  bankName: string
  accountNumber: string
  accountName: string
}
