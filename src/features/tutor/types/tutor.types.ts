import type {
  Address,
  DayOfWeek,
  EducationLevel,
  TeachingMode,
  UserStatus,
  VerificationStatus,
} from "@/shared/types/common.types";
import type { SubjectResponse } from "@/features/subject/types/subject.types";
import type { ContactInfo } from "@/features/user/types/user.types";

type SubjectSummary = Pick<SubjectResponse, "id" | "name">;

export interface Certificate {
  name: string;
  issuer: string;
  year: number;
}

export interface ScheduleSlot {
  day: DayOfWeek;
  from: string;
  to: string;
}

export interface TutorResponse {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  education?: string;
  experienceYears: number;
  hourlyRate: number;
  averageRating: number;
  reviewCount?: number;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  /** BE trả về single subject theo spec mới */
  subject?: SubjectResponse;
  address?: Address;
  teachingMode?: TeachingMode;
  /** Chỉ có sau khi kết nối thành công */
  contact?: ContactInfo;
  createdAt?: string;
  certificates?: Certificate[];
  educationLevels?: EducationLevel[];
  /** BE trả danh sách môn; `subject` là môn đầu tiên */
  subjects?: SubjectSummary[];
  /** Khu vực nhận dạy (BE: teachingAreas) */
  teachingAreas?: string[];
  userStatus?: UserStatus;
  /** Lịch dạy (BE: availableSlots) */
  schedule?: ScheduleSlot[];
}

export interface TutorFilter {
  subjectName?: string;
  province?: string;
  teachingMode?: TeachingMode | "";
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  cursor?: string;
  limit?: number;
}

export interface TutorProfilePayload {
  subjectId: string;
  experienceYears: number;
  education: string;
  hourlyRate: number;
  bio: string;
  address: Address;
  teachingMode: TeachingMode;
  certificates: Certificate[];
}
