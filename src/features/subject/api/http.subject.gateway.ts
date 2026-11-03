import type { IHttpClient } from "@/config/http/IHttpClient";
import type {
  SubjectRequest,
  SubjectResponse as SubjectResponseDto,
} from "../types/subject.dto";
import type {
  SubjectPageParams,
  SubjectResponse,
} from "../types/subject.types";
import type { CursorResponse } from "@/shared/types/common.dto";
import type { SubjectGateway } from "./subject.gateway";
import { toCursorPage, toSubject } from "../mapper/subject.mapper";

const SUBJECTS = "/v1/subjects";

/**
 * Gọi API thật. Nhận `IHttpClient` qua constructor (DIP).
 * GET đọc danh sách/chi tiết; POST/PUT/DELETE cần token ADMIN nên
 * hãy truyền client có gắn Authorization (không phải client PUBLIC).
 */
export class HttpSubjectGateway implements SubjectGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getPage(
    params: SubjectPageParams = {},
  ): Promise<CursorResponse<SubjectResponse>> {
    // Tự ghép query string để không phụ thuộc chữ ký `params` của IHttpClient.
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await this.http.get<CursorResponse<SubjectResponseDto>>(
      qs ? `${SUBJECTS}?${qs}` : SUBJECTS,
    );
    return toCursorPage(res, toSubject);
  }

  async getById(id: string): Promise<SubjectResponse> {
    return toSubject(
      await this.http.get<SubjectResponseDto>(`${SUBJECTS}/${id}`),
    );
  }

  async create(req: SubjectRequest): Promise<SubjectResponse> {
    return toSubject(await this.http.post<SubjectResponseDto>(SUBJECTS, req));
  }

  async update(id: string, req: SubjectRequest): Promise<SubjectResponse> {
    return toSubject(
      await this.http.put<SubjectResponseDto>(`${SUBJECTS}/${id}`, req),
    );
  }

  async remove(id: string): Promise<void> {
    await this.http.delete<void>(`${SUBJECTS}/${id}`);
  }
}
