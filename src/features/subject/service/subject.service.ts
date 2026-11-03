import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { delay } from "@/mocks/session";
import { subjects } from "@/mocks/db";
import type { SubjectResponse } from "../types/subject.types";

const ALL_PAGE_SIZE = 50;
const MAX_PAGES = 100; // chặn vòng lặp vô hạn nếu BE trả cursor sai

/**
 * Use-case của môn học: chỉ gọi gateway.
 */
export class SubjectService {
  private readonly gateway: SubjectGateway;

  constructor(gateway: SubjectGateway) {
    this.gateway = gateway;
  }

  getPage(
    params?: SubjectPageParams,
  ): Promise<CursorResponse<SubjectResponse>> {
    return this.gateway.getPage(params);
  }

  /** Lấy toàn bộ môn học (duyệt hết các trang) — dùng cho dropdown/đăng ký. */
  async getAll(): Promise<SubjectResponse[]> {
    const all: SubjectResponse[] = [];
    let cursor: string | undefined;

    for (let i = 0; i < MAX_PAGES; i++) {
      const page = await this.gateway.getPage({
        cursor,
        limit: ALL_PAGE_SIZE,
      });
      all.push(...page.content);
      if (!page.hasNext || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return all;
  }

  getById(id: string): Promise<SubjectResponse> {
    return this.gateway.getById(id);
  }

  create(req: SubjectRequest): Promise<SubjectResponse> {
    return this.gateway.create(req);
  }

  update(id: string, req: SubjectRequest): Promise<SubjectResponse> {
    return this.gateway.update(id, req);
  }

  remove(id: string): Promise<void> {
    return this.gateway.remove(id);
  }
}
