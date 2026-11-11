import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import {
  ApiError,
  type CursorResponse,
  type PageResponse,
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
import type { PostResponse } from "@/features/post/types/post.types";
import type { AdminPostFilter } from "@/features/post/types/post.types";
import type { BaseUserResponse } from "@/features/user/types/user.types";
import type {
  AdminTransactionFilter,
  TransactionResponse,
} from "@/features/wallet/types/wallet.types";
import type {
  AdminStats,
  ComplaintDecisionPayload,
  FeeRateConfig,
  FeeRatePayload,
  ProfileReviewPayload,
  ReviewComplaint,
} from "../types/admin.types";
import {
  applications,
  feeRates,
  nextId,
  notifications,
  posts,
  recountSubjectUsage,
  reviews,
  revenueHistory,
  transactions,
  tutors,
  users,
  wallets,
} from "@/mocks/db";
import { cursorPaginate, delay, paginate, requireUser } from "@/mocks/session";
import { fromBeTransaction } from "@/features/wallet/service/wallet.service";
import type { RevenueStatistics } from "@/features/wallet/types/wallet.types";
import { recomputeRating } from "@/features/review/service/review.service";

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

  async getTransactions(
    params: AdminTransactionFilter = {},
  ): Promise<PageResponse<TransactionResponse>> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const list = transactions
        .filter((t) => !params.status || t.transactionStatus === params.status)
        .filter((t) => !params.tutorId || t.tutorId === params.tutorId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return paginate(list, params.page, params.pageSize ?? 10);
    }
    return http
      .get<PageResponse<TransactionResponse>>("/v1/admin/transactions")
      .then((res) => res.data); // TODO: nối API
  },

  async getFeeRates(): Promise<FeeRateConfig[]> {
    if (USE_MOCK) {
      await delay(250);
      return [...feeRates].sort(
        (a, b) => +new Date(b.effectiveFrom) - +new Date(a.effectiveFrom),
      );
    }
    return http
      .get<FeeRateConfig[]>("/v1/admin/fee-rates")
      .then((res) => res.data); // TODO: nối API
  },

  /** Mức mới chỉ áp dụng từ ngày hiệu lực; giao dịch cũ không bị ảnh hưởng. */
  async createFeeRate(payload: FeeRatePayload): Promise<FeeRateConfig> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      if (payload.ratePercent <= 0 || payload.ratePercent > 100)
        throw new ApiError(
          "Tỉ lệ phải trong khoảng 0–100%.",
          "INVALID_RATE",
          400,
        );
      const created: FeeRateConfig = {
        id: nextId("fr"),
        rate: payload.ratePercent / 100,
        effectiveFrom: payload.effectiveFrom,
        createdBy: "Quản trị viên",
        active: true,
        fixedFee: payload.fixedFee ?? 0,
      };
      for (const f of feeRates)
        if (
          f.active &&
          new Date(f.effectiveFrom) <= new Date(created.effectiveFrom)
        ) {
          f.active = false;
          f.effectiveTo = created.effectiveFrom;
        }
      feeRates.push(created);
      return created;
    }
    // BE: POST /v1/payments/fee-configs { feePercentage (0..1), fixedFee, effectiveFrom }
    const r = await http
      .post<{
        id: string;
        feePercentage: number;
        fixedFee: number;
        effectiveFrom: string;
        effectiveTo?: string;
      }>("/v1/payments/fee-configs", {
        feePercentage: payload.ratePercent / 100,
        fixedFee: payload.fixedFee ?? 0,
        effectiveFrom: payload.effectiveFrom,
      })
      .then((res) => res.data);
    return {
      id: r.id,
      rate: r.feePercentage,
      fixedFee: r.fixedFee,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo,
      createdBy: "Quản trị viên",
      active: !r.effectiveTo,
    };
  },

  /** Hoàn tiền một giao dịch phí nhận lớp (COMMISSION, SUCCESS) → REFUNDED, trả lại ví gia sư. */
  async refundTransaction(id: string): Promise<TransactionResponse> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const t = transactions.find((x) => x.id === id);
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (
        t.transactionType !== "COMMISSION" ||
        t.transactionStatus !== "SUCCESS"
      ) {
        throw new ApiError(
          "Chỉ hoàn tiền được giao dịch phí nhận lớp đã thành công.",
          "NOT_REFUNDABLE",
          409,
        );
      }
      t.transactionStatus = "REFUNDED";
      if (t.tutorId) wallets[t.tutorId] = (wallets[t.tutorId] ?? 0) + t.amount;
      return { ...t };
    }
    return fromBeTransaction(
      await http
        .post<
          Parameters<typeof fromBeTransaction>[0]
        >(`/v1/payments/${id}/refund`)
        .then((res) => res.data),
    );
  },

  /** Thống kê doanh thu/vận hành trong khoảng ngày (mặc định 12 tháng gần nhất). */
  async getRevenueStatistics(
    range: { from?: string; to?: string } = {},
  ): Promise<RevenueStatistics> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const now = new Date();
      const from =
        range.from ||
        new Date(now.getTime() - 365 * 86_400_000).toISOString().slice(0, 10);
      const to = range.to || now.toISOString().slice(0, 10);
      const start = new Date(from).getTime();
      const end = new Date(to).getTime() + 86_400_000;
      const inRange = transactions.filter((t) => {
        const d = new Date(t.createdAt).getTime();
        return d >= start && d < end;
      });
      const sum = (f: (t: TransactionResponse) => boolean) =>
        inRange.filter(f).reduce((s, t) => s + t.amount, 0);
      const count = (f: (t: TransactionResponse) => boolean) =>
        inRange.filter(f).length;
      const commission = (t: TransactionResponse) =>
        t.transactionType === "COMMISSION";
      return {
        from,
        to,
        totalRevenue: sum(
          (t) => commission(t) && t.transactionStatus === "SUCCESS",
        ),
        totalRefunded: sum(
          (t) => commission(t) && t.transactionStatus === "REFUNDED",
        ),
        totalTopUp: sum(
          (t) =>
            t.transactionType === "TOP_UP" && t.transactionStatus === "SUCCESS",
        ),
        successCount: count(
          (t) => commission(t) && t.transactionStatus === "SUCCESS",
        ),
        failedCount: count((t) => t.transactionStatus === "FAILED"),
        refundedCount: count((t) => t.transactionStatus === "REFUNDED"),
        topUpCount: count(
          (t) =>
            t.transactionType === "TOP_UP" && t.transactionStatus === "SUCCESS",
        ),
        totalTransactions: inRange.length,
      };
    }
    return http
      .get<RevenueStatistics>("/v1/payments/statistics/revenue")
      .then((res) => res.data);
  },

  async getComplaints(): Promise<ReviewComplaint[]> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      return reviews
        .filter(
          (r) =>
            r.complaintStatus === "OPEN" || r.complaintStatus === "RESOLVED",
        )
        .map((r) => ({
          id: `cp-${r.id}`,
          reviewId: r.id,
          tutorId: r.tutorId,
          tutorName: tutors.find((t) => t.id === r.tutorId)?.fullName ?? "—",
          rating: r.rating,
          reviewComment: r.comment,
          reason: r.complaintReason ?? "",
          status:
            r.complaintStatus === "OPEN"
              ? ("OPEN" as const)
              : ("RESOLVED" as const),
          decision: r.complaintDecision,
          decisionNote: r.complaintDecisionNote,
          createdAt: r.createdAt ?? new Date().toISOString(),
        }));
    }
    return http
      .get<ReviewComplaint[]>("/v1/admin/complaints")
      .then((res) => res.data); // TODO: nối API
  },

  /** Giữ hoặc gỡ đánh giá kèm lý do. Gỡ → xóa review và tính lại điểm trung bình. */
  async decideComplaint(
    reviewId: string,
    payload: ComplaintDecisionPayload,
  ): Promise<void> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const idx = reviews.findIndex((r) => r.id === reviewId);
      const r = reviews[idx];
      if (!r) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (payload.decision === "REMOVED") {
        reviews.splice(idx, 1);
        recomputeRating(r.tutorId);
      } else {
        r.complaintStatus = "RESOLVED";
        r.complaintDecision = "KEPT";
        r.complaintDecisionNote = payload.note;
      }
      return;
    }
    await http.put<void>(`/v1/admin/complaints/${reviewId}`, payload); // TODO: nối API
  },

  async getStats(): Promise<AdminStats> {
    if (USE_MOCK) {
      await delay();
      requireAdmin();
      const thisMonth = transactions
        .filter(
          (t) =>
            t.transactionType === "COMMISSION" &&
            t.transactionStatus === "SUCCESS",
        )
        .reduce((s, t) => s + t.amount, 0);
      const revenueByMonth = [
        ...revenueHistory.slice(0, -1),
        {
          label: revenueHistory[revenueHistory.length - 1]?.label ?? "T10",
          revenue:
            (revenueHistory[revenueHistory.length - 1]?.revenue ?? 0) +
            thisMonth,
        },
      ];
      const statuses = ["DRAFT", "PUBLISHED", "CLOSED", "REMOVED"] as const;
      const paid = applications.filter(
        (a) => a.applicationStatus === "FINISHED",
      );
      const byTutor = new Map<string, number>();
      for (const a of paid) {
        const tid =
          a.post.type === "FIND_TUTOR" ? a.tutor.id : a.post.author.id;
        byTutor.set(tid, (byTutor.get(tid) ?? 0) + 1);
      }
      return {
        revenueByMonth,
        postsByStatus: statuses.map((status) => ({
          status,
          count: posts.filter((p) => p.status === status).length,
        })),
        totalSuccessfulMatches: paid.length + 18,
        topTutors: [
          ...[...byTutor.entries()].map(([tutorId, c]) => ({
            tutorId,
            fullName: tutors.find((t) => t.id === tutorId)?.fullName ?? "—",
            matchCount: c + 4,
          })),
          { tutorId: "t-3", fullName: "Phạm Ngọc Mai", matchCount: 9 },
          { tutorId: "t-4", fullName: "Nguyễn Quốc Bảo", matchCount: 6 },
        ]
          .filter(
            (v, i, arr) => arr.findIndex((x) => x.tutorId === v.tutorId) === i,
          )
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 5),
      };
    }
    return http.get<AdminStats>("/v1/admin/stats").then((res) => res.data); // TODO: nối API
  },
};
