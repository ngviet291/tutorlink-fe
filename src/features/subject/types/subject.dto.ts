// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.


/** BE: subject/dto/request/SubjectRequest.java */
export interface SubjectRequest {
  name: string
  description?: string
  category: string
}

/** BE: subject/dto/response/SubjectResponse.java */
export interface SubjectResponse {
  id: string
  name: string
  description: string
  category: string
}
