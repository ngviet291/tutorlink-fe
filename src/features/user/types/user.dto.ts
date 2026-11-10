// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type {
  DayOfWeek,
  EducationLevel,
  Gender,
  TeachingMode,
  UserStatus,
  VerificationStatus,
} from "@/shared/types/common.types";

/** BE: user/dto/request/AddressRequest.java */
export interface AddressRequest {
  street: string;
  ward?: string;
  province: string;
}
export interface AvailableSlotRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}
export interface AvailableSlotResponse {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}
/** BE: user/dto/request/ApproveTutorRequest.java */
export interface ApproveTutorRequest {
  approved: boolean;
  reason?: string;
}

/** BE: user/dto/request/UpdateProfileRequest.java */
export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: AddressRequest;
}

/** BE: user/dto/request/UpdateUserStatusRequest.java */
export interface UpdateUserStatusRequest {
  userStatus: UserStatus;
}

/** BE: user/dto/response/AddressResponse.java */
export interface AddressResponse {
  street: string;
  ward: string;
  province: string;
}

/** BE: user/dto/response/BaseUserResponse.java */
export interface BaseUserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: AddressResponse;
  userStatus: UserStatus;
  role: string;
}

/** BE: user/dto/response/StudentResponse.java */
export interface StudentResponse extends BaseUserResponse {
  grade?: string;
  learningGoal?: string;
}

/** BE: user/dto/response/SubjectResponse.java */
export interface SubjectResponse {
  id: string;
  name: string;
}

/** BE: user/dto/response/TutorResponse.java */
export interface TutorResponse extends BaseUserResponse {
  experienceYears?: number;
  education?: string;
  subjects: SubjectResponse[];
  averageRating?: number;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  bio?: string;
  hourlyRate?: number;
  teachingLevels?: EducationLevel[];
  teachingMode?: TeachingMode;
  teachingAreas?: string[];
  availableSlots?: AvailableSlotResponse[];
}

export interface UpdateTutorProfileRequest {
  bio?: string;
  experienceYears?: number; 
  education?: string;
  hourlyRate?: number; 
  teachingLevels?: EducationLevel[];
  teachingMode?: TeachingMode;
  teachingAreas?: string[];
  availableSlots?: AvailableSlotRequest[];
  subjectIds?: string[];
}
