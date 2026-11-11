import { toAuthUser } from "@/features/auth/mappers/auth.mapper";
import type {
  TutorProfilePayload,
  TutorResponse,
} from "@/features/tutor/types/tutor.types";
import type {
  TutorResponse as TutorResponseDto,
  UpdateTutorProfileRequest,
} from "../types/user.dto";
import type { BaseUserResponse } from "../types/user.types";

/** BE BaseUserResponse (role có thể là "ROLE_X") → model FE. Dùng chung cho admin list/detail. */
export const toBaseUser = (
  dto: Parameters<typeof toAuthUser>[0],
): BaseUserResponse => toAuthUser(dto);

/** BE trả Instant (ISO, UTC) → "HH:mm" theo giờ Việt Nam. */
function toHourMinute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/**
 * BE TutorResponse → model FE `TutorResponse`.
 * - `subjects[]` (BE) → `subject` (FE chỉ hiển thị 1 môn; giữ cả `subjects` để dùng sau)
 * - `teachingLevels` (BE) → `educationLevels` (FE)
 * - `contact` KHÔNG map: FE chỉ cho phép hiện sau khi kết nối/thanh toán phí.
 * - `certificates`: BE không trả trong TutorResponse → để trống.
 */
export function toTutor(dto: TutorResponseDto): TutorResponse {
  return {
    id: dto.id,
    fullName: dto.fullName,
    avatarUrl: dto.avatarUrl ?? undefined,
    bio: dto.bio ?? undefined,
    education: dto.education ?? undefined,
    experienceYears: dto.experienceYears ?? 0,
    hourlyRate: dto.hourlyRate ?? 0,
    averageRating: dto.averageRating ?? 0,
    verificationStatus: dto.verificationStatus,
    verificationNote: dto.verificationNote ?? undefined,
    userStatus: dto.userStatus,
    subject: dto.subjects?.[0],
    subjects: dto.subjects ?? [],
    address: dto.address
      ? {
          street: dto.address.street,
          ward: dto.address.ward,
          province: dto.address.province,
        }
      : undefined,
    teachingMode: dto.teachingMode,
    teachingAreas: dto.teachingAreas ?? [],
    educationLevels: dto.teachingLevels,
    schedule: (dto.availableSlots ?? []).map((s) => ({
      day: s.dayOfWeek,
      from: toHourMinute(s.startTime),
      to: toHourMinute(s.endTime),
    })),
  };
}

/**
 * Form hồ sơ gia sư (FE) → body `PUT /v1/users/me/tutor-profile` (BE).
 * - `subjectId` → `subjectIds: [subjectId]`
 * - `address.province` → `teachingAreas: [province]` (BE không có address trong hồ sơ gia sư;
 *   địa chỉ cá nhân đổi qua `PUT /v1/users/me`). Chỉ gửi khi có chọn tỉnh.
 * - `certificates` bị bỏ: BE chưa có endpoint cập nhật chứng chỉ ở đây.
 */
export function toUpdateTutorProfileRequest(
  p: TutorProfilePayload,
): UpdateTutorProfileRequest {
  const province = p.address?.province?.trim();
  return {
    bio: p.bio,
    experienceYears: p.experienceYears,
    education: p.education,
    hourlyRate: p.hourlyRate,
    teachingMode: p.teachingMode,
    subjectIds: p.subjectId ? [p.subjectId] : undefined,
    teachingAreas: province ? [province] : undefined,
  };
}
