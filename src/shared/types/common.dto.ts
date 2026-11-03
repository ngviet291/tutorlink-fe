// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { MediaType } from "@/shared/types/common.types";

export type { ApiResponse } from "./api.types";

/** BE: common/dto/response/AccountBanErrorResponse.java */
export interface AccountBanErrorResponse extends ErrorResponse {
  lockedUntil?: string;
  remainingSeconds?: number;
}

/** BE: common/dto/response/CursorResponse.java */
export interface CursorResponse<T> {
  content: T[];
  hasNext: boolean;
  nextCursor?: string;
}

/** BE: common/dto/response/ErrorResponse.java */
export interface ErrorResponse {
  timestamp?: string;
  status: number;
  error?: string;
  message?: string;
  path?: string;
  errors?: Record<string, string>;
}

/** BE: common/dto/response/UploadMediaResponse.java */
export interface UploadMediaResponse {
  publicId: string;
  url: string;
  mediaType: MediaType;
}
