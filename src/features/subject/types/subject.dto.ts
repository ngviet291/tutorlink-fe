// Kiểu dữ liệu tương ứng DTO của backend; giữ nguyên tên trường theo hợp đồng API.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

/** BE: subject/dto/request/SubjectRequest.java */
export interface SubjectRequest {
  name: string;
  description?: string;
  category: string;
}

/** BE: subject/dto/response/SubjectResponse.java */
export interface SubjectResponse {
  id: string;
  name: string;
  description: string;
  category: string;
}
