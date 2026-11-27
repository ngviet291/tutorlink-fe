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
  // Thông tin thêm từ UserSummary (cho Tutor)
  averageRating?: number;
  totalReviews?: number;
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

/** BE: user/dto/response/SubjectProfileResponse.java */
export interface SubjectProfileResponse {
  subject: SubjectResponse;
  experienceYears?: number;
  hourlyRate?: number;
  teachingMode?: TeachingMode;
}

/** BE: user/dto/request/SubjectProfileRequest.java */
export interface SubjectProfileRequest {
  subjectId: string;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: TeachingMode;
}

/** BE: user/dto/response/TutorResponse.java */
export interface TutorResponse extends BaseUserResponse {
  experienceYears?: number;
  education?: string;
  subjects: SubjectResponse[];
  subjectProfiles?: SubjectProfileResponse[];
  averageRating?: number;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  bio?: string;
  hourlyRate?: number;
  teachingLevels?: EducationLevel[];
  teachingMode?: TeachingMode;
  teachingAreas?: string[];
  availableSlots?: AvailableSlotResponse[];
  certificates?: CertificateResponse[];
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
  subjectProfiles?: SubjectProfileRequest[];
}
export interface CertificateResponse {
  id: string;
  name?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate?: string;
  fileUrl: string;
  verified: boolean;
  /** AI không tự duyệt được, đang chờ admin duyệt tay */
  pendingAdminReview?: boolean;
  reviewNote?: string;
  subjectId?: string;
  subjectName?: string;
}
export interface SubjectProfileResponse {
  subject: SubjectResponse;
  experienceYears?: number;
  hourlyRate?: number;
  teachingMode?: TeachingMode;
}
export interface SubjectProfileRequest {
  subjectId: string;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: TeachingMode;
}
