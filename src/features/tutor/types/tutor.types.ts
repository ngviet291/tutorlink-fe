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

/** Thông tin giảng dạy riêng của một môn. */
export interface SubjectProfile {
  subjectId: string;
  subjectName: string;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: TeachingMode;
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
  subjects?: SubjectSummary[];
  /** Kinh nghiệm / giá / hình thức dạy riêng từng môn */
  subjectProfiles?: SubjectProfile[];
  teachingAreas?: string[];
  userStatus?: UserStatus;
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
  // Thông tin chung
  education: string;
  bio: string;
  teachingAreas: string[];
  educationLevels: EducationLevel[];
  schedule: ScheduleSlot[];
  // Thông tin riêng từng môn
  subjectProfiles: SubjectProfile[];
}
export interface SubjectProfile {
  subjectId: string;
  subjectName: string;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: TeachingMode;
}
