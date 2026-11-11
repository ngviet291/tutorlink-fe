import { mockConfig } from "@/config/env";
import { ApiError } from "@/shared/types/api.types";
import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
import { DEMO_PASSWORD, passwords } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";
import { http } from "@/config/axiosClient";
import { toBaseUser } from "../mapper/user.mapper";
import type { BaseUserResponse as BaseUserDto } from "../types/user.dto";

const USE_MOCK = mockConfig.user;

export const userService = {
  async getMe(): Promise<AuthUser> {
    if (USE_MOCK) {
      await delay(200);
      return { ...requireUser() };
    }
    return http
      .get<BaseUserDto>("/v1/users/me")
      .then((res) => toBaseUser(res.data));
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      me.fullName = payload.fullName;
      me.phone = payload.phone;
      me.gender = payload.gender;
      me.dateOfBirth = payload.dateOfBirth;
      me.address = payload.address;
      return { ...me };
    }
    return http
      .put<BaseUserDto>("/v1/users/me", payload)
      .then((res) => toBaseUser(res.data));
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      if (payload.currentPassword !== (passwords[me.id] ?? DEMO_PASSWORD)) {
        throw new ApiError("Wrong password", "WRONG_PASSWORD", 400);
      }
      passwords[me.id] = payload.newPassword;
      return;
    }
    await http.put<void>("/v1/auth/change-password", payload);
  },
};
