import type { NotificationGateway } from "./notification.gateway";
import type { NotificationResponse } from "../types/notification.types";
import type { CursorResponse } from "@/shared/types/common.dto";
import type { IHttpClient } from "@/config/http/IHttpClient";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
} // ĐỔI: dùng type có sẵn

export class HttpNotificationGateway implements NotificationGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getMyNotifications(cursor: string | undefined, limit: number) {
    const res = await this.http.get<CursorResponse<NotificationResponse>>(
      "/v1/notifications",
      { params: { cursor, limit } }, // ĐỔI: theo chữ ký get() của AxiosHttpClient
    );
    return res;
  }

  async markAsRead(id: string) {
    const res = await this.http.patch<NotificationResponse>(
      `/v1/notifications/${id}/read`,
    );
    return res;
  }

  async markAllAsRead() {
    const res = await this.http.patch<number>("/v1/notifications/read-all");
    return res;
  }
}
