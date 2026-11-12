import type { IHttpClient } from "@/config/http/IHttpClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { ChatGateway } from "./chat.gateway";
import type {
  ChatChannelResponse,
  MessageResponse,
  SendMessageRequest,
} from "../types/chat.dto";
import type { MediaType } from "@/shared/types/common.types";
import type { MediaPayload } from "../types/chat.types";

const BASE = "/v1/chat";

export class HttpChatGateway implements ChatGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  listChannels(cursor?: string, size?: number) {
    return this.http.get<CursorResponse<ChatChannelResponse>>(
      `${BASE}/channels`,
      {
        params: { cursor, size },
      },
    );
  }

  getChannel(channelId: string) {
    return this.http.get<ChatChannelResponse>(`${BASE}/channels/${channelId}`);
  }

  getChannelWithUser(userId: string) {
    return this.http.get<ChatChannelResponse>(
      `${BASE}/channels/with/${userId}`,
    );
  }

  listMessages(channelId: string, cursor?: string, size?: number) {
    return this.http.get<CursorResponse<MessageResponse>>(
      `${BASE}/channels/${channelId}/messages`,
      {
        params: { cursor, size },
      },
    );
  }

  sendMessage(req: SendMessageRequest) {
    return this.http.post<MessageResponse>(BASE, req);
  }

  async markRead(channelId: string): Promise<void> {
    await this.http.patch<unknown>(`${BASE}/channels/${channelId}/read`);
  }

  getUnreadCount() {
    return this.http.get<number>(`${BASE}/unread-count`);
  }

  async uploadMedia(channelId: string, mediaType: MediaType, file: File) {
    const form = new FormData();
    form.append("file", file); // tên part phải là "file" để khớp @RequestPart
    // Không tự set Content-Type, để browser gắn boundary
    const res = await this.http.post(
      `/v1/upload-media/${channelId}/${mediaType}`, // chỉnh prefix cho đúng controller
      form,
    );
    return res as MediaPayload;
  }
}
