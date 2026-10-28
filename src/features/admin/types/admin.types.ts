export interface FeeRateConfig {
  id: string
  /** Tỉ lệ dạng 0..1, ví dụ 0.2 = 20% */
  rate: number
  effectiveFrom: string
  createdBy: string
  active: boolean
}

export interface FeeRatePayload {
  ratePercent: number
  effectiveFrom: string
}

export interface RevenuePoint {
  label: string
  revenue: number
}

export interface TopTutorStat {
  tutorId: string
  fullName: string
  matchCount: number
}

export interface AdminStats {
  revenueByMonth: RevenuePoint[]
  postsByStatus: { status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED'; count: number }[]
  totalSuccessfulMatches: number
  topTutors: TopTutorStat[]
}

export interface ReviewComplaint {
  id: string
  reviewId: string
  tutorId: string
  tutorName: string
  rating: number
  reviewComment: string
  reason: string
  status: 'OPEN' | 'RESOLVED'
  decision?: 'KEPT' | 'REMOVED'
  decisionNote?: string
  createdAt: string
}

export interface ComplaintDecisionPayload {
  decision: 'KEPT' | 'REMOVED'
  note: string
}

export interface ProfileReviewPayload {
  decision: 'APPROVED' | 'REJECTED'
  note?: string
}
