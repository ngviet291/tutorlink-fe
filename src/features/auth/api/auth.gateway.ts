import type {
  ForgotPasswordRequest,
  IntrospectRequest,
  IntrospectResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterStudentRequest,
  RegisterTutorRequest,
  ResetPasswordRequest,
} from "../types/auth.dto";
import type { AuthResponse, AuthTokens } from "../types/auth.types";

/**
 * Các hợp đồng nhỏ (ISP) — consumer chỉ phụ thuộc phần mình cần.
 * Request dùng DTO của BE; response trả về model của FE (đã map).
 */
export interface SessionGateway {
  login(req: LoginRequest): Promise<AuthResponse>;
  refreshToken(req: RefreshTokenRequest): Promise<AuthTokens>;
  logout(req: LogoutRequest): Promise<void>;
  introspect(req: IntrospectRequest): Promise<IntrospectResponse>;
}

export interface RegistrationGateway {
  registerStudent(req: RegisterStudentRequest): Promise<AuthResponse>;
  registerTutor(req: RegisterTutorRequest): Promise<AuthResponse>;
}

export interface PasswordRecoveryGateway {
  forgotPassword(req: ForgotPasswordRequest): Promise<void>;
  resetPassword(req: ResetPasswordRequest): Promise<void>;
}

export interface AuthGateway
  extends SessionGateway, RegistrationGateway, PasswordRecoveryGateway {}
