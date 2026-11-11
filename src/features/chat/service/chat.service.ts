import { ApiError } from "@/config/http/apiError";
import type { ChatGateway } from "../api/chat.gateway";
import {
  toChatMessage,
  toChatThread,
  toMessagePage,
  toSendMessageRequest,
} from "../mapper/chat.mapper";
import type {
  ChatMessage,
  ChatThread,
  MediaPayload,
  MessagePage,
} from "../types/chat.types";
import type { MediaType } from "@/shared/types/common.types";

const CHANNEL_PAGE_SIZE = 50;
/** Chặn vòng lặp vô hạn nếu BE trả cursor sai. */
const MAX_CHANNEL_PAGES = 20;

/** Use-case chat: gọi gateway và map DTO sang model UI. Không biết axios hay React. */
export class ChatService {
  private readonly gateway: ChatGateway;

  constructor(gateway: ChatGateway) {
    this.gateway = gateway;
  }

  /** Toàn bộ channel của tôi (mới nhất trước). Số channel của một người nhỏ nên gom hết các trang. */
  async listChannels(): Promise<ChatThread[]> {
    const threads: ChatThread[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < MAX_CHANNEL_PAGES; i += 1) {
      const page = await this.gateway.listChannels(cursor, CHANNEL_PAGE_SIZE);
      threads.push(...page.content.map(toChatThread));
      if (!page.hasNext || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return threads;
  }

  async getChannel(channelId: string): Promise<ChatThread> {
    return toChatThread(await this.gateway.getChannel(channelId));
  }

  /** `null` khi chưa có channel (BE trả 404). Các lỗi khác được ném lại. */
  async findChannelWithPartner(partnerId: string): Promise<ChatThread | null> {
    try {
      return toChatThread(await this.gateway.getChannelWithUser(partnerId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  async getMessages(
    channelId: string,
    cursor?: string,
    size?: number,
  ): Promise<MessagePage> {
    return toMessagePage(
      await this.gateway.listMessages(channelId, cursor, size),
    );
  }

  // async sendMessage(receiverId: string, content: string): Promise<ChatMessage> {
  //   return toChatMessage(
  //     await this.gateway.sendMessage(toSendMessageRequest(receiverId, content)),
  //   );
  // }

  async uploadMedia(channelId: string, mediaType: MediaType, file: File) {
    return this.gateway.uploadMedia(channelId, mediaType, file);
  }

  markRead(channelId: string): Promise<void> {
    return this.gateway.markRead(channelId);
  }

  getUnreadCount(): Promise<number> {
    return this.gateway.getUnreadCount();
  }
  async sendMessage(
    receiverId: string,
    content: string,
    media: MediaPayload[] = [],
  ): Promise<ChatMessage> {
    return toChatMessage(
      await this.gateway.sendMessage(
        toSendMessageRequest(receiverId, content, media),
      ),
    );
  }
}
