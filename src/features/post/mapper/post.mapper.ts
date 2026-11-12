import type { CursorResponse } from "@/shared/types/api.types";
import type {
  CreatePostRequest,
  PostAddressRequest,
  PostResponse as PostResponseDto,
  UpdatePostRequest,
} from "../types/post.dto";
import type { PostPage, PostPayload, PostResponse } from "../types/post.types";

const num = (n: unknown): number | undefined =>
  typeof n === "number" && !Number.isNaN(n) ? n : undefined;

/** Form gửi "YYYY-MM-DD", BE cần Instant ISO. Giữ nguyên nếu đã là ISO. */
export function toDeadlineInstant(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.includes("T")) return value;
  return new Date(`${value}T23:59:59`).toISOString();
}

/** BE yêu cầu đủ street, ward, province; ONLINE thì không gửi địa chỉ. */
function toAddress(payload: PostPayload): PostAddressRequest | undefined {
  if (payload.teachingMode === "ONLINE") return undefined;
  const a = payload.address;
  return {
    street: a?.street ?? "",
    ward: a?.ward ?? "",
    province: a?.province ?? "",
  };
}

export function toCreatePostRequest(
  payload: PostPayload,
  asDraft: boolean,
): CreatePostRequest {
  return {
    title: payload.title.trim(),
    content: payload.content.trim(),
    type: payload.type,
    subjectId: payload.subjectId,
    educationLevel: payload.educationLevel,
    teachingMode: payload.teachingMode,
    budgetUnit: payload.budgetUnit,
    status: asDraft ? "DRAFT" : "PUBLISHED",
    address: toAddress(payload),
    minBudget: num(payload.minBudget),
    maxBudget: num(payload.maxBudget),
    sessionsPerWeek: num(payload.sessionsPerWeek),
    durationMinutes: num(payload.durationMinutes),
    deadline: toDeadlineInstant(payload.deadline),
  };
}

export function toUpdatePostRequest(payload: PostPayload): UpdatePostRequest {
  const { status: _status, ...rest } = toCreatePostRequest(payload, false);
  return rest; // title bắt buộc, đã có trong rest
}

/** DTO BE -> model UI (điền mặc định cho field mà UI coi là bắt buộc). */
export function toPost(dto: PostResponseDto): PostResponse {
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content ?? "",
    type: dto.type,
    status: dto.status,
    author: dto.author,
    subject: dto.subject,
    educationLevel: dto.educationLevel ?? "HIGH_SCHOOL",
    teachingMode: dto.teachingMode,
    address: dto.address
      ? {
          street: dto.address.street,
          ward: dto.address.ward,
          province: dto.address.province,
        }
      : null,
    minBudget: dto.minBudget ?? 0,
    maxBudget: dto.maxBudget ?? 0,
    budgetUnit: dto.budgetUnit,
    sessionsPerWeek: dto.sessionsPerWeek ?? 0,
    durationMinutes: dto.durationMinutes ?? 0,
    deadline: dto.deadline ?? "",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toPostPage<D, M>(
  res: CursorResponse<D>,
  map: (dto: D) => M,
): PostPage<M> {
  return {
    content: res.content.map(map),
    hasNext: res.hasNext,
    nextCursor: res.nextCursor,
  };
}

/** Chỉ giữ các key BE nhận, bỏ rỗng/NaN. */
export function toQueryParams(
  source: object,
  allowed: readonly string[],
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  Object.entries(source).forEach(([k, v]) => {
    if (!allowed.includes(k)) return;
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "number" && Number.isNaN(v)) return;
    out[k] = v as string | number;
  });
  return out;
}

const COMMON = [
  "keyword",
  "type",
  "subjectName",
  "teachingMode",
  "educationLevel",
  "minBudget",
  "maxBudget",
  "cursor",
  "limit",
] as const;

export const LIST_KEYS = [...COMMON, "authorId"] as const;
export const ADMIN_KEYS = COMMON;
export const MY_KEYS = [...COMMON, "postStatus"] as const;
