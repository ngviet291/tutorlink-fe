import { env, mockConfig } from "@/config/env";
import { ApiError } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
import { DEMO_PASSWORD, passwords, users } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";
import { http } from "@/config/axiosClient";

const USE_MOCK = mockConfig.user;

export const userService = {
  async getMe(): Promise<AuthUser> {
    if (USE_MOCK) {
      await delay(200);
      return { ...requireUser() };
    }
    return http.get<AuthUser>("/v1/users/me").then((res) => res.data);
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
    return http.put<AuthUser>("/v1/users/me", payload).then((res) => res.data);
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
    await http.put<void>("/v1/auth/reset-password", payload);
  },
};
