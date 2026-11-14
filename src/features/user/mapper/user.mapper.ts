import { toAuthUser } from "@/features/auth/mappers/auth.mapper";
import type { DayOfWeek } from "@/shared/types/common.types";
import type {
  ScheduleSlot,
  TutorProfilePayload,
  TutorResponse,
} from "@/features/tutor/types/tutor.types";
import type {
  AvailableSlotRequest,
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

// BE chỉ dùng độ dài khoảng giờ (AvailabilityChecker) nên giờ được gắn vào một tuần mẫu bắt đầu từ thứ Hai này,
// khớp với cách InitData của BE tạo dữ liệu. Giờ nhập theo giờ Việt Nam (UTC+7).
const SLOT_REFERENCE_MONDAY_UTC = Date.UTC(2026, 0, 5);
const VIETNAM_UTC_OFFSET = "+07:00";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/** ("TUESDAY", "08:30") → Instant ISO (UTC) */
function toSlotInstant(day: DayOfWeek, hourMinute: string): string {
  const date = new Date(SLOT_REFERENCE_MONDAY_UTC + DAY_INDEX[day] * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
  return new Date(`${date}T${hourMinute}:00${VIETNAM_UTC_OFFSET}`).toISOString();
}

/** Bỏ ô lịch chưa nhập đủ hoặc giờ kết thúc không sau giờ bắt đầu. */
function toAvailableSlots(schedule: ScheduleSlot[]): AvailableSlotRequest[] {
  return schedule
    .filter((slot) => slot.from && slot.to && slot.from < slot.to)
    .map((slot) => ({
      dayOfWeek: slot.day,
      startTime: toSlotInstant(slot.day, slot.from),
      endTime: toSlotInstant(slot.day, slot.to),
    }));
}

/**
 * Form hồ sơ gia sư (FE) → body `PUT /v1/users/me/tutor-profile` (BE).
 * - `subjectId` → `subjectIds: [subjectId]`
 * - `educationLevels` → `teachingLevels`, `schedule` → `availableSlots`, `teachingAreas` gửi nguyên.
 *   Danh sách rỗng vẫn được gửi để gia sư có thể xóa hết.
 * - `address` không gửi: hồ sơ gia sư của BE không có địa chỉ (đổi qua `PUT /v1/users/me`).
 * - `certificates` bị bỏ: BE chưa có endpoint cập nhật chứng chỉ ở đây.
 */
export function toUpdateTutorProfileRequest(
  p: TutorProfilePayload,
): UpdateTutorProfileRequest {
  return {
    bio: p.bio,
    experienceYears: p.experienceYears,
    education: p.education,
    hourlyRate: p.hourlyRate,
    teachingMode: p.teachingMode,
    subjectIds: p.subjectId ? [p.subjectId] : undefined,
    teachingLevels: p.educationLevels,
    teachingAreas: p.teachingAreas,
    availableSlots: toAvailableSlots(p.schedule),
  };
}
