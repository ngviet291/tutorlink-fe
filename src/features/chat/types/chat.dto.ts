// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { MediaType } from "@/shared/types/common.types";

/** BE: chat/dto/request/ChatChannelRequest.java */
export interface ChatChannelRequest {}

/** BE: chat/dto/request/MediaRequest.java */
export interface MediaRequest {
  publicId: string;
  url: string;
  mediaType: MediaType;
}

/** BE: chat/dto/request/SendMessageRequest.java */
export interface SendMessageRequest {
  receiverId: string;
  /** có thể rỗng nếu có media */
  content?: string;
  mediaList?: MediaRequest[];
}

/** BE: chat/dto/response/ChatChannelResponse.java */
export interface ChatChannelResponse {
  id: string;
  lastMessageAt?: string;
  /** người còn lại so với user hiện tại */
  partner: ParticipantResponse;
}

/** BE: chat/dto/response/MediaResponse.java */
export interface MediaResponse {
  publicId: string;
  url: string;
  mediaType: MediaType;
}

/** BE: chat/dto/response/MessageResponse.java */
export interface MessageResponse {
  id: string;
  chatChannelId: string;
  senderId: string;
  content?: string;
  sentAt: string;
  mediaList?: MediaResponse[];
}

/** BE: chat/dto/response/ParticipantResponse.java */
export interface ParticipantResponse {
  id: string;
  fullName: string;
  avatarUrl?: string;
}
