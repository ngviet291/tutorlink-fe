import type { ApplicationResponse } from '@/features/application/types/application.types'
import { feeRates } from './db'

export interface EnrollmentFeeQuote {
  monthlyTuition: number
  feeRate: number
  feeAmount: number
}

/** Tỉ lệ đang có hiệu lực: bản ghi active có ngày hiệu lực gần nhất không vượt quá hiện tại. */
export function currentFeeRate(): number {
  const now = Date.now()
  const valid = feeRates
    .filter((f) => f.active && new Date(f.effectiveFrom).getTime() <= now)
    .sort((a, b) => +new Date(b.effectiveFrom) - +new Date(a.effectiveFrom))
  return valid[0]?.rate ?? 0.2
}

export function quoteFor(app: ApplicationResponse): EnrollmentFeeQuote {
  const monthlyTuition = Math.round((app.post.minBudget + app.post.maxBudget) / 2 / 1000) * 1000
  const feeRate = currentFeeRate()
  return { monthlyTuition, feeRate, feeAmount: Math.round((monthlyTuition * feeRate) / 1000) * 1000 }
}

/** Gia sư là bên trả phí. */
export function payerTutorId(app: ApplicationResponse): string {
  return app.post.type === 'FIND_TUTOR' ? app.tutor.id : app.post.author.id
}
