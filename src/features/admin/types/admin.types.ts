/** Chứng chỉ AI không tự duyệt được, chờ admin (GET /v1/admin/certificates/pending). */
export interface PendingCertificate {
  id: string;
  tutorId: string;
  tutorName: string;
  subjectId?: string;
  subjectName?: string;
  name?: string;
  fileUrl: string;
  /** Lý do AI không tự duyệt được */
  reviewNote?: string;
  submittedAt?: string;
}

export interface FeeRateConfig {
  id: string;
  /** Tỉ lệ dạng 0..1, ví dụ 0.2 = 20% */
  rate: number;
  fixedFee: number;
  effectiveFrom: string;
  createdBy: string;
  createdByName?: string;
  active: boolean;
  /** Ngày hết hiệu lực; rỗng nếu đang áp dụng */
  effectiveTo?: string;
}

export interface FeeRatePayload {
  ratePercent: number;
  effectiveFrom: string;
  fixedFee?: number;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export interface TopTutorStat {
  tutorId: string;
  fullName: string;
  matchCount: number;
}

export interface AdminStats {
  revenueByMonth: RevenuePoint[];
  postsByStatus: {
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "REMOVED";
    count: number;
  }[];
  totalSuccessfulMatches: number;
  topTutors: TopTutorStat[];
}

export interface ReviewComplaint {
  id: string;
  reviewId: string;
  tutorId: string;
  tutorName: string;
  rating: number;
  reviewComment: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  decision?: "KEPT" | "REMOVED";
  decisionNote?: string;
  createdAt: string;
}

export interface ComplaintDecisionPayload {
  decision: "KEPT" | "REMOVED";
  note: string;
}

export interface ProfileReviewPayload {
  decision: "APPROVED" | "REJECTED";
  note?: string;
}
