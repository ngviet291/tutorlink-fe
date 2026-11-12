import type { CursorResponse } from "@/shared/types/api.types";
import type {
  ChatChannelResponse,
  MessageResponse,
  SendMessageRequest,
} from "../types/chat.dto";
import type { MediaType } from "@/shared/types/common.types";
import type { MediaPayload } from "../types/chat.types";

/** Cổng gọi API chat của BE (`/v1/chat/**`). Trả DTO của BE, chưa map sang model UI. */
export interface ChatGateway {
  listChannels(
    cursor?: string,
    size?: number,
  ): Promise<CursorResponse<ChatChannelResponse>>;
  getChannel(channelId: string): Promise<ChatChannelResponse>;
  /** 404 nếu hai người chưa có channel. */
  getChannelWithUser(userId: string): Promise<ChatChannelResponse>;
  /** Thứ tự mới → cũ, cursor = id tin cuối của trang trước. */
  listMessages(
    channelId: string,
    cursor?: string,
    size?: number,
  ): Promise<CursorResponse<MessageResponse>>;
  sendMessage(req: SendMessageRequest): Promise<MessageResponse>;
  markRead(channelId: string): Promise<void>;
  getUnreadCount(): Promise<number>;
  uploadMedia(
    channelId: string,
    mediaType: MediaType,
    file: File,
  ): Promise<MediaPayload>;
}
