import type { UserGateway } from "../api/user.gateway";
import type {
  AuthUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";
export class UserService {
  private readonly gateway: UserGateway;

  constructor(gateway: UserGateway) {
    this.gateway = gateway;
  }

  getMe(): Promise<AuthUser> {
    return this.gateway.getMe();
  }

  updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    return this.gateway.updateProfile(payload);
  }

  uploadAvatar(file: File): Promise<AuthUser> {
    return this.gateway.uploadAvatar(file);
  }

  changePassword(payload: ChangePasswordPayload): Promise<void> {
    return this.gateway.changePassword(payload);
  }
}
