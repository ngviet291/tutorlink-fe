import type { CursorResponse } from "@/shared/types/api.types";
import type {
  ChatChannelResponse,
  MediaRequest,
  MessageResponse,
  SendMessageRequest,
} from "../types/chat.dto";
import type {
  ChatMessage,
  ChatThread,
  MediaPayload,
  MessagePage,
  MessageReadReceipt,
  MessageStatus,
} from "../types/chat.types";

// const toMedia = (m: MediaResponse): ChatMedia => ({
//   id: m.id,
//   publicId: m.publicId,
//   url: m.url,
//   mediaType: m.mediaType,
// });

export function toChatMessage(
  dto: MessageResponse,
  status: MessageStatus = "sent",
): ChatMessage {
  return {
    id: dto.id,
    channelId: dto.chatChannelId,
    senderId: dto.senderId,
    content: dto.content ?? "",
    sentAt: dto.sentAt,
    media: (dto.mediaList ?? []).map((m) => ({
      publicId: m.publicId,
      url: m.url,
      mediaType: m.mediaType,
    })),
    status,
  };
}

export function toChatThread(dto: ChatChannelResponse): ChatThread {
  return {
    channelId: dto.id,
    partner: {
      id: dto.partner.id,
      fullName: dto.partner.fullName,
      avatarUrl: dto.partner.avatarUrl,
    },
    lastMessageAt: dto.lastMessageAt,
    unreadCount: 0,
  };
}

export function toMessagePage(
  res: CursorResponse<MessageResponse>,
): MessagePage {
  return {
    messages: res.content.map((m) => toChatMessage(m)),
    hasNext: res.hasNext,
    nextCursor: res.nextCursor,
  };
}

// export function toSendMessageRequest(
//   receiverId: string,
//   content: string,
// ): SendMessageRequest {
//   return { receiverId, content: content.trim() };
// }

/** Nội dung hiển thị ở hộp thư. */
// export function previewOf(
//   message: Pick<ChatMessage, "content" | "media">,
// ): string {
//   if (message.content.trim()) return message.content;
//   return message.media.length > 0 ? "Đã gửi tệp đính kèm" : "";
// }

export function previewOf(message: ChatMessage): string {
  if (message.content) return message.content;
  const first = message.media?.[0];
  switch (first?.mediaType) {
    case "IMAGE":
      return "📷 Hình ảnh";
    case "VIDEO":
      return "🎬 Video";
    case "AUDIO":
      return "🎵 Âm thanh";
    case "FILE":
      return "📎 Tệp đính kèm";
    default:
      return "";
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** Kiểm tra payload của event MESSAGE_NEW (cùng cấu trúc MessageResponse). */
export function isMessageResponse(v: unknown): v is MessageResponse {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.chatChannelId === "string" &&
    typeof v.senderId === "string" &&
    typeof v.sentAt === "string" &&
    (v.content === undefined ||
      v.content === null ||
      typeof v.content === "string") &&
    (v.mediaList === undefined ||
      v.mediaList === null ||
      Array.isArray(v.mediaList))
  );
}

/** Kiểm tra payload của event MESSAGE_READ. */
export function isMessageReadReceipt(v: unknown): v is MessageReadReceipt {
  return (
    isRecord(v) &&
    typeof v.channelId === "string" &&
    typeof v.readerId === "string" &&
    typeof v.readAt === "string"
  );
}

export function toSendMessageRequest(
  receiverId: string,
  content: string,
  media: MediaPayload[] = [],
): SendMessageRequest {
  const mediaList: MediaRequest[] = media.map((m) => ({
    publicId: m.publicId,
    url: m.url,
    mediaType: m.mediaType,
  }));
  return {
    receiverId,
    content: content || undefined, // content có thể rỗng khi có media
    ...(mediaList.length > 0 && { mediaList }),
  };
}
