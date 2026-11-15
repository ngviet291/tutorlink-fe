import type { CursorResponse } from "@/shared/types/common.dto";
import type { SubjectRequest } from "../types/subject.dto";
import type { SubjectPageParams, SubjectResponse } from "../types/subject.types";

/**
 * Tách hợp đồng theo trách nhiệm để nơi sử dụng chỉ phụ thuộc phần cần thiết.
 * Yêu cầu dùng DTO của backend; kết quả trả về mô hình frontend đã chuyển đổi.
 */
export interface SubjectQueryGateway {
  getPage(params?: SubjectPageParams): Promise<CursorResponse<SubjectResponse>>;
  getById(id: string): Promise<SubjectResponse>;
}

/** Chỉ ADMIN được gọi (BE chặn bằng role). */
export interface SubjectAdminGateway {
  create(req: SubjectRequest): Promise<SubjectResponse>;
  update(id: string, req: SubjectRequest): Promise<SubjectResponse>;
  remove(id: string): Promise<void>;
}

export interface SubjectGateway extends SubjectQueryGateway, SubjectAdminGateway {}
