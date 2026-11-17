import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
export interface UserGateway {
  getMe(): Promise<AuthUser>;
  updateProfile(payload: UpdateProfilePayload): Promise<AuthUser>;
  changePassword(payload: ChangePasswordPayload): Promise<void>;
  uploadAvatar(file: File): Promise<AuthUser>;
}
