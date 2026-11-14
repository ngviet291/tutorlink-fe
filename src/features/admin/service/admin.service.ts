import { adminPaymentService } from "./admin.payment.service";
import { adminStatsService } from "./admin.stats.service";
import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import {
  ApiError,
  type CursorResponse,
} from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type { AccountStatus, Role } from "@/shared/types/common.types";
import type { VerificationStatus } from "@/shared/types/common.types";
import { toBaseUser, toTutor } from "@/features/user/mapper/user.mapper";
import type {
  BaseUserResponse as BaseUserDto,
  TutorResponse as TutorResponseDto,
} from "@/features/user/types/user.dto";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { BaseUserResponse } from "@/features/user/types/user.types";
import type {
  ProfileReviewPayload,
} from "../types/admin.types";
import {
  nextId,
  notifications,
  posts,
  recountSubjectUsage,
  tutors,
  users,
} from "@/mocks/db";
import { cursorPaginate, delay, requireUser } from "@/mocks/session";

const USE_MOCK = mockConfig.admin;
/** Quản lý người dùng + duyệt gia sư (/v1/users...) có cờ riêng. */
const USE_MOCK_USER = mockConfig.adminUser;

export interface AdminUserFilter {
  role?: Role;
  status?: AccountStatus;
  verificationStatus?: VerificationStatus;
  cursor?: string;
  limit?: number;
}

const ROLE_PARAM = (r?: Role) => r; // BE RoleName: STUDENT | TUTOR | ADMIN

function requireAdmin(): void {
  const me = requireUser();
  if (me.role !== "ADMIN")
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
}

export const adminService = {
  /** Gia sư chờ duyệt = GET /v1/users?role=TUTOR&verificationStatus=PENDING (duyệt hết các trang). */
  async getPendingTutors(): Promise<TutorResponse[]> {
    if (USE_MOCK_USER) {
      await delay();
      requireAdmin();
      return tutors.filter((t) => t.verificationStatus === "PENDING");
    }
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

  /** PATCH /v1/users/{id}/approve { approved, reason } */
  async reviewTutor(
    tutorId: string,
    payload: ProfileReviewPayload,
  ): Promise<TutorResponse> {
    if (USE_MOCK_USER) {
      await delay();
      requireAdmin();
      const t = tutors.find((x) => x.id === tutorId);
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      t.verificationStatus = payload.decision;
      t.verificationNote = payload.note || undefined;
      notifications[tutorId] = [
        {
          id: nextId("n"),
          notificationType: "SYSTEM" as const,
          isRead: false,
          createdAt: new Date().toISOString(),
          title:
            payload.decision === "APPROVED"
              ? "Hồ sơ gia sư đã được duyệt"
              : "Hồ sơ gia sư bị từ chối",
          content:
            payload.decision === "APPROVED"
              ? "Bạn có thể đăng ký nhận lớp ngay bây giờ."
              : (payload.note ?? "Vui lòng cập nhật lại hồ sơ."),
        },
        ...(notifications[tutorId] ?? []),
      ];
      return t;
    }
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
    if (USE_MOCK_USER) {
      await delay();
      requireAdmin();
      const list = users
        .filter((u) => !params.role || u.role === params.role)
        .filter((u) => !params.status || u.userStatus === params.status)
        .filter(
          (u) =>
            !params.verificationStatus ||
            tutors.find((t) => t.id === u.id)?.verificationStatus ===
              params.verificationStatus,
        )
        .map((u) => ({ ...u }));
      return cursorPaginate(
        list,
        params.cursor,
        (u) => u.id,
        params.limit ?? 10,
      );
    }
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
    if (USE_MOCK_USER) {
      await delay(200);
      requireAdmin();
      const u = users.find((x) => x.id === id);
      if (!u) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      return { ...u };
    }
    return http
      .get<BaseUserDto>(`/v1/users/${id}`)
      .then((res) => toBaseUser(res.data));
  },

  /** PATCH /v1/users/{id}/status { userStatus } */
  async setUserStatus(
    userId: string,
    status: AccountStatus,
  ): Promise<BaseUserResponse> {
    if (USE_MOCK_USER) {
      await delay();
      requireAdmin();
      const u = users.find((x) => x.id === userId);
      if (!u) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (u.role === "ADMIN")
        throw new ApiError("Không thể khóa tài khoản Admin.", "FORBIDDEN", 403);
      u.userStatus = status;
      return { ...u };
    }
    return http
      .patch<BaseUserDto>(`/v1/users/${userId}/status`, { userStatus: status })
      .then((res) => toBaseUser(res.data));
  },

  /** Gỡ bài vi phạm → REMOVED. */
  async removePost(postId: string, reason: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const p = posts.find((x) => x.id === postId);
      if (!p) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      p.status = "REMOVED";
      notifications[p.author.id] = [
        {
          id: nextId("n"),
          notificationType: "SYSTEM" as const,
          title: "Bài đăng bị gỡ",
          content: `"${p.title}" đã bị gỡ: ${reason}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...(notifications[p.author.id] ?? []),
      ];
      recountSubjectUsage();
      return;
    }
    await http.put<void>(`/v1/admin/posts/${postId}/remove`, { reason }); // TODO: nối API
  },

  ...adminPaymentService,
  getStats: adminStatsService.getStats,
};
