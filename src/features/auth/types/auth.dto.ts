// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { Gender } from "@/shared/types/common.types";
import type {
  AddressRequest,
  BaseUserResponse,
} from "@/features/user/types/user.dto";

/** BE: auth/dto/request/ForgotPasswordRequest.java */
export interface ForgotPasswordRequest {
  email: string;
}

/** BE: auth/dto/request/IntrospectRequest.java */
export interface IntrospectRequest {
  accessToken: string;
}

/** BE: auth/dto/request/LoginRequest.java */
export interface LoginRequest {
  email: string;
  password: string;
}

/** BE: auth/dto/request/LogoutRequest.java */
export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

/** BE: auth/dto/request/RefreshTokenRequest.java */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** BE: auth/dto/request/RegisterStudentRequest.java */
export interface RegisterStudentRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address: AddressRequest;
  grade?: string;
  learningGoal?: string;
}

/** BE: auth/dto/request/RegisterTutorRequest.java */
export interface RegisterTutorRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address: AddressRequest;
  experienceYears: number;
  education?: string;
  subjectIds: string[];
  certificates?: File[];
}

/** BE: auth/dto/request/ResetPasswordRequest.java */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** BE: auth/dto/response/AuthenticateResponse.java */
export interface AuthenticateResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  user: BaseUserResponse;
}

/** BE: auth/dto/response/IntrospectResponse.java */
export interface IntrospectResponse {
  active: boolean;
  scope?: string;
  clientId?: string;
  userId?: string;
  exp: number;
  iat: number;
  sub?: string;
}
