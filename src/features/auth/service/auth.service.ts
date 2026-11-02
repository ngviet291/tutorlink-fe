import type {
  ForgotPasswordRequest,
  IntrospectResponse,
  LoginRequest,
  RegisterStudentRequest,
  RegisterTutorRequest,
  ResetPasswordRequest,
} from "../types/auth.dto";
import type { AuthResponse } from "../types/auth.types";
import type { AuthUser } from "@/features/user/types/user.types";
import type { AuthGateway } from "../api/auth.gateway";
/**
 * Use-case của phiên đăng nhập: gọi gateway + lưu/xoá token.
 * Không biết axios hay mock — chỉ biết `AuthGateway` và `TokenStore` (DIP).
 */
import type { ITokenStorage } from "@/config/storage/types";

export class AuthService {
  private readonly gateway: AuthGateway;
  private readonly tokens: ITokenStorage;

  constructor(gateway: AuthGateway, tokens: ITokenStorage) {
    this.gateway = gateway;
    this.tokens = tokens;
  }

  login(req: LoginRequest): Promise<AuthUser> {
    return this.startSession(this.gateway.login(req));
  }

  registerStudent(req: RegisterStudentRequest): Promise<AuthUser> {
    return this.startSession(this.gateway.registerStudent(req));
  }

  registerTutor(req: RegisterTutorRequest): Promise<AuthUser> {
    return this.startSession(this.gateway.registerTutor(req));
  }

  async logout(): Promise<void> {
    const accessToken = await this.tokens.getAccessToken();
    const refreshToken = await this.tokens.getRefreshToken();

    try {
      if (accessToken && refreshToken) {
        await this.gateway.logout({ accessToken, refreshToken });
      }
    } finally {
      await this.tokens.clear();
    }
  }

  forgotPassword(req: ForgotPasswordRequest): Promise<void> {
    return this.gateway.forgotPassword(req);
  }

  resetPassword(req: ResetPasswordRequest): Promise<void> {
    return this.gateway.resetPassword(req);
  }

  async introspect(): Promise<IntrospectResponse | null> {
    const accessToken = await this.tokens.getAccessToken();
    return accessToken ? this.gateway.introspect({ accessToken }) : null;
  }

  private async startSession(
    pending: Promise<AuthResponse>,
  ): Promise<AuthUser> {
    const { accessToken, refreshToken, user } = await pending;

    await this.tokens.saveAccessToken(accessToken);
    await this.tokens.saveRefreshToken(refreshToken);

    return user;
  }
}
