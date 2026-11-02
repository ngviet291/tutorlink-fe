import type { IHttpClient } from "@/config/http/IHttpClient";
import type {
  AuthenticateResponse,
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
import { toAuthResponse } from "../mappers/auth.mapper";
import type { AuthGateway } from "./auth.gateway";

const AUTH = "/v1/auth";

/**
 * Gọi API thật. Nhận `IHttpClient` qua constructor (DIP).
 * Toàn bộ /v1/auth/** đi qua client PUBLIC vì token nằm trong body / chưa đăng nhập.
 */
export class HttpAuthGateway implements AuthGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    const res = await this.http.post<AuthenticateResponse>(
      `${AUTH}/login`,
      req,
    );
    console.log(res);
    return toAuthResponse(res);
  }

  async registerStudent(req: RegisterStudentRequest): Promise<AuthResponse> {
    return toAuthResponse(
      await this.http.post<AuthenticateResponse>(
        `${AUTH}/register/student`,
        req,
      ),
    );
  }

  async registerTutor(req: RegisterTutorRequest): Promise<AuthResponse> {
    return toAuthResponse(
      await this.http.post<AuthenticateResponse>(`${AUTH}/register/tutor`, req),
    );
  }

  async refreshToken(req: RefreshTokenRequest): Promise<AuthTokens> {
    const { accessToken, refreshToken } =
      await this.http.post<AuthenticateResponse>(`${AUTH}/refresh-token`, req);
    return { accessToken, refreshToken };
  }

  async logout(req: LogoutRequest): Promise<void> {
    await this.http.post<void>(`${AUTH}/logout`, req);
  }

  async forgotPassword(req: ForgotPasswordRequest): Promise<void> {
    await this.http.post<void>(`${AUTH}/forgot-password`, req);
  }

  async resetPassword(req: ResetPasswordRequest): Promise<void> {
    await this.http.post<void>(`${AUTH}/reset-password`, req);
  }

  introspect(req: IntrospectRequest): Promise<IntrospectResponse> {
    return this.http.post<IntrospectResponse>(`${AUTH}/introspect`, req);
  }
}
