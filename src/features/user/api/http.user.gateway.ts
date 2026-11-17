import type { IHttpClient } from "@/config/http/IHttpClient";
import { toBaseUser } from "../mapper/user.mapper";
import type { BaseUserResponse as BaseUserDto } from "../types/user.dto";
import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
import type { UserGateway } from "./user.gateway";

const USERS = "/v1/users";
export class HttpUserGateway implements UserGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getMe(): Promise<AuthUser> {
    return toBaseUser(await this.http.get<BaseUserDto>(`${USERS}/me`));
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    return toBaseUser(
      await this.http.put<BaseUserDto>(`${USERS}/me`, payload),
    );
  }
  async uploadAvatar(file: File): Promise<AuthUser> {
    const form = new FormData();
    form.append("avatar", file);
    return toBaseUser(
      await this.http.post<BaseUserDto>(`${USERS}/me/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await this.http.put<void>("/v1/auth/change-password", payload);
  }
}
