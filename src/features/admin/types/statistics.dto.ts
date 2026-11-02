// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.


/** BE: statistics/dto/Period.java */
export interface Period {
  startDate: string
  endDate: string
}

/** BE: statistics/dto/response/AcceptedPointResponse.java */
export interface AcceptedPointResponse {
  periodStart: string
  periodEnd: string
  totalAccepted: number
}

/** BE: statistics/dto/response/RevenuePointResponse.java */
export interface RevenuePointResponse {
  periodStart: string
  periodEnd: string
  totalRevenue: number
  totalTransactions: number
}

/** BE: statistics/dto/response/TopTutorResponse.java */
export interface TopTutorResponse {
  tutorId: string
  fullName: string
  averageRating: number
  acceptedCount: number
}
