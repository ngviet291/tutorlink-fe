import type { CursorResponse } from "@/shared/types/common.dto";
import type { SubjectRequest } from "../types/subject.dto";
import type {
  SubjectPageParams,
  SubjectResponse,
} from "../types/subject.types";

/**
 * Các hợp đồng nhỏ (ISP) — consumer chỉ phụ thuộc phần mình cần.
 * Request dùng DTO của BE; response trả về model của FE (đã map).
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

export interface SubjectGateway
  extends SubjectQueryGateway, SubjectAdminGateway {}
