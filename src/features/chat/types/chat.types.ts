import type { MediaType } from "@/shared/types/common.types";

/** sending/failed chỉ tồn tại ở FE (optimistic). `read` = đối phương đã xem (từ event MESSAGE_READ). */
export type MessageStatus = "sending" | "sent" | "read" | "failed";

export interface ChatPartner {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  sentAt: string;
  /** v1 chỉ gửi văn bản; model đã chừa chỗ cho media. */
  media?: MediaPayload[];
  status: MessageStatus;
}

/** Một dòng trong hộp thư: cuộc trò chuyện với một đối tác. */
export interface ChatThread {
  channelId: string;
  partner: ChatPartner;
  /** BE chưa trả: FE tự giữ từ event/tin đã tải. */
  lastMessage?: string;
  lastMessageAt?: string;
  /** BE chưa trả theo từng channel: FE tự đếm từ event, mất khi tải lại trang. */
  unreadCount: number;
}

/** Một trang tin nhắn, thứ tự mới → cũ như BE. */
export interface MessagePage {
  messages: ChatMessage[];
  hasNext: boolean;
  nextCursor?: string;
}

export interface MessageReadReceipt {
  channelId: string;
  readerId: string;
  readAt: string;
}
export interface MediaPayload {
  publicId: string;
  url: string;
  mediaType: MediaType;
}

export interface SendMessageInput {
  content: string;
  media?: MediaPayload;
}

export function detectMediaType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return "FILE";
}

const TEMP_PREFIX = "tmp-";
export const newTempId = (): string =>
  `${TEMP_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const isTempId = (id: string): boolean => id.startsWith(TEMP_PREFIX);
