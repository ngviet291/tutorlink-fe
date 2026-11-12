import type { CursorResponse } from "@/shared/types/api.types";
import {
  ADMIN_KEYS,
  LIST_KEYS,
  MY_KEYS,
  toQueryParams,
} from "../mapper/post.mapper";
import type {
  CreatePostRequest,
  PostApplicationResponse,
  PostResponse,
  PostStatisticsByStatus,
  RemovePostRequest,
  UpdatePostRequest,
} from "../types/post.dto";
import type {
  AdminPostFilter,
  MyPostFilter,
  PostFilter,
} from "../types/post.types";
import type { PostGateway } from "./post.gateway";
import type { IHttpClient } from "@/config/http/IHttpClient";

const BASE = "/v1/posts";

/** Mọi endpoint /v1/posts cần đăng nhập, truyền privateHttp vào. */
export class HttpPostGateway implements PostGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  create(req: CreatePostRequest) {
    return this.http.post<PostResponse>(BASE, req);
  }

  getById(postId: string) {
    return this.http.get<PostResponse>(`${BASE}/${postId}`);
  }

  getByIdForMe(postId: string) {
    return this.http.get<PostResponse>(`${BASE}/${postId}/me`);
  }

  list(filter: PostFilter) {
    return this.http.get<CursorResponse<PostResponse>>(BASE, {
      params: toQueryParams(filter, LIST_KEYS), // province bị loại vì BE không nhận
    });
  }

  listAdmin(filter: AdminPostFilter) {
    return this.http.get<CursorResponse<PostResponse>>(`${BASE}/admin`, {
      params: toQueryParams(filter, ADMIN_KEYS),
    });
  }

  listMine(filter: MyPostFilter) {
    return this.http.get<CursorResponse<PostResponse>>(`${BASE}/me`, {
      params: toQueryParams(filter, MY_KEYS),
    });
  }

  listApplications(postId: string, cursor?: string, limit = 10) {
    return this.http.get<CursorResponse<PostApplicationResponse>>(
      `${BASE}/${postId}/applications`,
      { params: toQueryParams({ cursor, limit }, ["cursor", "limit"]) },
    );
  }

  update(postId: string, req: UpdatePostRequest) {
    return this.http.put<PostResponse>(`${BASE}/${postId}`, req);
  }

  publish(postId: string) {
    return this.http.patch<PostResponse>(`${BASE}/${postId}/publish`);
  }

  async close(postId: string) {
    await this.http.patch<void>(`${BASE}/${postId}/close`);
  }

  async delete(postId: string) {
    await this.http.delete<void>(`${BASE}/${postId}`);
  }

  async removeByAdmin(postId: string, reason?: string) {
    const body: RemovePostRequest = { reason };
    await this.http.patch<void>(`${BASE}/${postId}/remove`, body);
  }

  async getByIdForAdmin(postId: string) {
    return this.http.get<PostResponse>(`${BASE}/${postId}/admin`);
  }

  statisticsByStatus() {
    return this.http.get<PostStatisticsByStatus[]>(
      `${BASE}/statistics/posts-by-status`,
    );
  }
}
