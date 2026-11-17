import { ApiError } from "@/shared/types/api.types";
import { DEMO_PASSWORD, passwords } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";
import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
import type { UserGateway } from "./user.gateway";

export class MockUserGateway implements UserGateway {
  async getMe(): Promise<AuthUser> {
    await delay(200);
    return { ...requireUser() };
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    await delay();
    const me = requireUser();
    me.fullName = payload.fullName;
    me.phone = payload.phone;
    me.gender = payload.gender;
    me.dateOfBirth = payload.dateOfBirth;
    me.address = payload.address;
    return { ...me };
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await delay();
    const me = requireUser();
    if (payload.currentPassword !== (passwords[me.id] ?? DEMO_PASSWORD)) {
      throw new ApiError("Wrong password", "WRONG_PASSWORD", 400);
    }
    passwords[me.id] = payload.newPassword;
  }
}
