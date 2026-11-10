import type {
  AuthenticateResponse,
  RegisterTutorRequest,
} from "../types/auth.dto";
import type { AuthResponse } from "../types/auth.types";
import type { BaseUserResponse } from "@/features/user/types/user.dto";
import type { AuthUser } from "@/features/user/types/user.types";
import type { Role } from "@/shared/types/common.types";

const ROLES: readonly Role[] = ["STUDENT", "TUTOR", "ADMIN"];

/** BE trả role dạng string (có thể "ROLE_TUTOR"); FE dùng union `Role`. */
export function toRole(raw: string): Role {
  const normalized = raw.replace(/^ROLE_/i, "").toUpperCase();
  const role = ROLES.find((r) => r === normalized);
  if (!role) throw new Error(`Unknown role from server: ${raw}`);
  return role;
}

export function toAuthUser(dto: BaseUserResponse): AuthUser {
  return {
    id: dto.id,
    fullName: dto.fullName,
    email: dto.email,
    phone: dto.phone,
    avatarUrl: dto.avatarUrl,
    gender: dto.gender,
    dateOfBirth: dto.dateOfBirth ?? "",
    address: {
      street: dto.address?.street,
      ward: dto.address?.ward,
      province: dto.address?.province,
    },
    userStatus: dto.userStatus,
    role: toRole(dto.role),
  };
}

export function toAuthResponse(dto: AuthenticateResponse): AuthResponse {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    user: toAuthUser(dto.user),
  };
}

export const toRegisterTutorFormData = ({
  certificates = [],
  ...data
}: RegisterTutorRequest): FormData => {
  const form = new FormData();
  // Part JSON phải có type application/json thì Spring mới parse vào @RequestPart
  form.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  certificates.forEach((file) => form.append("certificates", file));
  if (import.meta.env.DEV) {
    for (const [key, value] of form.entries()) {
      console.log(
        key,
        value instanceof File
          ? `File(${value.name}, ${value.size}B)`
          : "[json]",
      );
    }
  }
  return form;
};
