import type { CursorResponse } from "@/shared/types/api.types";
import type { IHttpClient } from "@/config/http/IHttpClient";
import type {
  ApplicationResponse,
  CreateApplicationRequest,
  RankedApplicationsResponse,
} from "../types/application.dto";
import type { PostApplicationItem } from "../types/application.types";
import type { BaseUserResponse } from "@/features/user/types/user.dto";
import type { ApplicationGateway } from "./application.gateway";

const BASE = "/v1/applications";

/** Mọi endpoint cần đăng nhập, truyền privateHttpClient vào. */
export class HttpApplicationGateway implements ApplicationGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  apply(req: CreateApplicationRequest) {
    return this.http.post<ApplicationResponse>(BASE, req);
  }

  getById(id: string) {
    return this.http.get<ApplicationResponse>(`${BASE}/${id}`);
  }

  listMine(limit = 100) {
    return this.http.get<CursorResponse<ApplicationResponse>>(`${BASE}/mine`, {
      params: { limit },
    });
  }

  listByPost(postId: string, limit = 100) {
    return this.http.get<CursorResponse<PostApplicationItem>>(
      `/v1/posts/${postId}/applications`,
      { params: { limit } },
    );
  }

  ranked(postId: string) {
    return this.http.get<RankedApplicationsResponse>(
      `${BASE}/post/${postId}/ranked`,
    );
  }

  select(id: string) {
    return this.http.post<ApplicationResponse>(`${BASE}/${id}/select`);
  }

  confirm(id: string) {
    return this.http.post<ApplicationResponse>(`${BASE}/${id}/confirm`);
  }

  finish(id: string) {
    return this.http.post<ApplicationResponse>(`${BASE}/${id}/finish`);
  }

  cancel(id: string) {
    return this.http.post<ApplicationResponse>(`${BASE}/${id}/cancel`);
  }

  async pay(id: string) {
    await this.http.post<void>(`/v1/payments/applications/${id}/pay`);
  }

  getPublicUser(userId: string) {
    return this.http.get<BaseUserResponse>(
      `/v1/users/${userId}/public-profile`,
    );
  }
}
