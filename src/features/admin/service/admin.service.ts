import { adminStatsService } from "./admin.stats.service";
import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { AccountStatus, Role } from "@/shared/types/common.types";
import type { VerificationStatus } from "@/shared/types/common.types";
import { toBaseUser, toTutor } from "@/features/user/mapper/user.mapper";
import type {
  BaseUserResponse as BaseUserDto,
  TutorResponse as TutorResponseDto,
} from "@/features/user/types/user.dto";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { BaseUserResponse } from "@/features/user/types/user.types";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import type {
  PendingCertificate,
  ProfileReviewPayload,
} from "../types/admin.types";

export interface AdminUserFilter {
  role?: Role;
  status?: AccountStatus;
  verificationStatus?: VerificationStatus;
  cursor?: string;
  limit?: number;
}

const ROLE_PARAM = (r?: Role) => r; // BE RoleName: STUDENT | TUTOR | ADMIN

export const adminService = {
  /** Gia sư chờ duyệt = GET /v1/users?role=TUTOR&verificationStatus=PENDING (duyệt hết các trang). */
  async getPendingTutors(): Promise<TutorResponse[]> {
    const all: TutorResponse[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 50; i++) {
      const page = await http
        .get<CursorResponse<TutorResponseDto>>("/v1/users", {
          params: {
            role: "TUTOR",
            verificationStatus: "PENDING",
            cursor,
            limit: 50,
          },
        })
        .then((res) => res.data);
      all.push(...(page.content ?? []).map(toTutor));
      if (!page.hasNext || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return all;
  },

  /** GET /v1/admin/certificates/pending — chứng chỉ AI không tự duyệt được. */
  async getPendingCertificates(): Promise<PendingCertificate[]> {
    return http
      .get<PendingCertificate[]>("/v1/admin/certificates/pending")
      .then((res) => res.data);
  },

  /** GET /v1/admin/certificates/tutor/{tutorId} — mọi chứng chỉ của gia sư. */
  async getTutorCertificates(tutorId: string): Promise<CertificateResponse[]> {
    return http
      .get<CertificateResponse[]>(`/v1/admin/certificates/tutor/${tutorId}`)
      .then((res) => res.data);
  },

  /** PATCH /v1/admin/certificates/{id}/review { approved, reason } */
  async reviewCertificate(
    certificateId: string,
    payload: { approved: boolean; reason?: string },
  ): Promise<void> {
    await http.patch(`/v1/admin/certificates/${certificateId}/review`, payload);
  },

  /** PATCH /v1/users/{id}/approve { approved, reason } */
  async reviewTutor(
    tutorId: string,
    payload: ProfileReviewPayload,
  ): Promise<TutorResponse> {
    return http
      .patch<TutorResponseDto>(`/v1/users/${tutorId}/approve`, {
        approved: payload.decision === "APPROVED",
        reason: payload.note || undefined,
      })
      .then((res) => toTutor(res.data));
  },

  /** GET /v1/users?role&status&verificationStatus&cursor&limit (cursor, không phải page). */
  async getUsers(
    params: AdminUserFilter = {},
  ): Promise<CursorResponse<BaseUserResponse>> {
    const page = await http
      .get<CursorResponse<BaseUserDto>>("/v1/users", {
        params: {
          role: ROLE_PARAM(params.role),
          status: params.status,
          verificationStatus: params.verificationStatus,
          cursor: params.cursor,
          limit: params.limit ?? 10,
        },
      })
      .then((res) => res.data);
    return {
      content: (page.content ?? []).map(toBaseUser),
      hasNext: page.hasNext ?? false,
      nextCursor: page.nextCursor,
    };
  },

  /** GET /v1/users/{id} — ADMIN. */
  async getUserById(id: string): Promise<BaseUserResponse> {
    return http
      .get<BaseUserDto>(`/v1/users/${id}`)
      .then((res) => toBaseUser(res.data));
  },

  /** PATCH /v1/users/{id}/status { userStatus } */
  async setUserStatus(
    userId: string,
    status: AccountStatus,
  ): Promise<BaseUserResponse> {
    return http
      .patch<BaseUserDto>(`/v1/users/${userId}/status`, { userStatus: status })
      .then((res) => toBaseUser(res.data));
  },

  getStats: adminStatsService.getStats,
};
