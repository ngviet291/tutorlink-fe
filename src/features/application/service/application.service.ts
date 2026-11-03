import { http } from "@/config/axiosClient";
import { env, mockConfig } from "@/config/env";
import { ApiError } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  AiSuggestionResponse,
  ApplicationResponse,
  ApplyPayload,
} from "../types/application.types";
import {
  applications,
  nextId,
  notifications,
  posts,
  transactions,
  tutors,
  users,
  wallets,
} from "@/mocks/db";
import { delay, requireUser, aiShouldFail } from "@/mocks/session";
import { rankApplications } from "@/mocks/ai";
import { payerTutorId, quoteFor } from "@/mocks/fee";

const USE_MOCK = mockConfig.application;

function notify(
  userId: string,
  n: {
    notificationType: "APPLICATION" | "PAYMENT" | "SYSTEM";
    title: string;
    content: string;
  },
): void {
  notifications[userId] = [
    {
      id: nextId("n"),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...n,
    },
    ...(notifications[userId] ?? []),
  ];
}

function findApp(id: string): ApplicationResponse {
  const a = applications.find((x) => x.id === id);
  if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
  return a;
}

export const applicationService = {
  async applyToPost(payload: ApplyPayload): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const post = posts.find((p) => p.id === payload.postId);
      if (!post || post.status !== "PUBLISHED") {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }
      if (post.author.id === me.id)
        throw new ApiError(ERROR_MESSAGES.OWN_POST, "OWN_POST", 409);
      if (
        applications.some((a) => a.post.id === post.id && a.tutor.id === me.id)
      ) {
        throw new ApiError(
          ERROR_MESSAGES.ALREADY_APPLIED,
          "ALREADY_APPLIED",
          409,
        );
      }
      if (me.role !== "TUTOR")
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      const t = tutors.find((x) => x.id === me.id);
      if (!t || t.verificationStatus !== "APPROVED") {
        throw new ApiError(
          ERROR_MESSAGES.TUTOR_NOT_APPROVED,
          "TUTOR_NOT_APPROVED",
          403,
        );
      }
      const student = users.find((u) => u.id === post.author.id);
      if (!student)
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      const created: ApplicationResponse = {
        id: nextId("ap"),
        post,
        tutor: t,
        student: student as any,
        applicationStatus: "PENDING",
        message: payload.message,
        proposedFee: payload.proposedFee,
        appliedAt: new Date().toISOString(),
      };
      applications.push(created);
      notify(post.author.id, {
        notificationType: "APPLICATION",
        title: "New application received",
        content: `${me.fullName} applied for "${post.title}".`,
      });
      return created;
    }
    return http
      .post<ApplicationResponse>("/v1/applications", payload)
      .then((res) => res.data);
  },

  async getMyApplications(): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      return applications
        .filter((a) => a.tutor.id === me.id || a.student.id === me.id)
        .sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt));
    }
    return http
      .get<ApplicationResponse[]>("/v1/applications/me")
      .then((res) => res.data);
  },

  async getConnections(): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      return applications.filter(
        (a) =>
          (a.applicationStatus === "PAID" ||
            a.applicationStatus === "FINISHED") &&
          (a.tutor.id === me.id || a.student.id === me.id),
      );
    }
    return http
      .get<ApplicationResponse[]>("/v1/applications/me?status=PAID")
      .then((res) => res.data);
  },

  async getApplicationsByPost(postId: string): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const post = posts.find((p) => p.id === postId);
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (post.author.id !== me.id && me.role !== "ADMIN") {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      }
      return applications
        .filter(
          (a) => a.post.id === postId && a.applicationStatus !== "CANCELLED",
        )
        .sort((a, b) => +new Date(a.appliedAt) - +new Date(b.appliedAt));
    }
    return http
      .get<ApplicationResponse[]>(`/v1/posts/${postId}/applications`)
      .then((res) => res.data);
  },

  async getAiTop5(postId: string): Promise<AiSuggestionResponse> {
    if (USE_MOCK) {
      await delay(700);
      if (aiShouldFail())
        throw new ApiError(
          ERROR_MESSAGES.AI_UNAVAILABLE,
          "AI_UNAVAILABLE",
          503,
        );
      const all = applications.filter((a) => a.post.id === postId);
      return { items: rankApplications(all), source: "AI" };
    }
    return http
      .get<AiSuggestionResponse>(`/v1/posts/${postId}/applications/ai-top5`)
      .then((res) => res.data);
  },

  async selectApplicant(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = findApp(id);
      if (a.post.author.id !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (a.applicationStatus !== "PENDING")
        throw new ApiError("Application is not pending.", "INVALID_STATE", 409);
      a.applicationStatus = "ACCEPTED";
      for (const o of applications) {
        if (
          o.post.id === a.post.id &&
          o.id !== a.id &&
          o.applicationStatus === "PENDING"
        ) {
          o.applicationStatus = "REJECTED";
        }
      }
      notify(a.tutor.id, {
        notificationType: "APPLICATION",
        title: "You have been selected!",
        content: `${a.student.fullName} selected you for "${a.post.title}".`,
      });
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/applications/${id}/select`)
      .then((res) => res.data);
  },

  async confirmAndPayFee(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay(600);
      const me = requireUser();
      const a = findApp(id);
      const tutorId = payerTutorId(a);
      if (tutorId !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (
        a.applicationStatus !== "ACCEPTED" &&
        a.applicationStatus !== "CONFIRMED"
      ) {
        throw new ApiError(
          "Application not in accepted state.",
          "INVALID_STATE",
          409,
        );
      }
      const { feeAmount } = quoteFor(a);
      const balance = wallets[tutorId] ?? 0;
      if (balance < feeAmount)
        throw new ApiError(
          ERROR_MESSAGES.INSUFFICIENT_BALANCE,
          "INSUFFICIENT_BALANCE",
          402,
        );
      wallets[tutorId] = balance - feeAmount;
      transactions.push({
        id: nextId("tx"),
        transactionType: "COMMISSION",
        amount: feeAmount,
        transactionStatus: "SUCCESS",
        applicationId: a.id,
        createdAt: new Date().toISOString(),
      });
      a.applicationStatus = "PAID";
      const post = posts.find((p) => p.id === a.post.id);
      if (post) post.status = "CLOSED";
      for (const uid of [a.student.id, a.tutor.id]) {
        notify(uid, {
          notificationType: "PAYMENT",
          title: "Connection successful",
          content: "Contact information and chat channel are now unlocked.",
        });
      }
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/payments/applications/${id}/pay`)
      .then((res) => res.data);
  },

  /** Chủ bài đăng xác nhận gia sư đã được chọn: ACCEPTED → CONFIRMED. */
  async confirmApplication(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = findApp(id);
      if (a.post.author.id !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (a.applicationStatus !== "ACCEPTED")
        throw new ApiError(
          "Chỉ xác nhận được đơn đã được chọn.",
          "INVALID_STATE",
          409,
        );
      a.applicationStatus = "CONFIRMED";
      notify(a.tutor.id, {
        notificationType: "APPLICATION",
        title: "Lớp đã được xác nhận",
        content: `Lớp "${a.post.title}" đã được xác nhận. Vui lòng thanh toán phí nhận lớp.`,
      });
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/applications/${id}/confirm`)
      .then((res) => res.data);
  },

  /** Một trong hai bên đánh dấu lớp đã hoàn thành: CONFIRMED/PAID → FINISHED. */
  async finishApplication(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = findApp(id);
      if (![a.tutor.id, a.student.id, a.post.author.id].includes(me.id))
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (a.applicationStatus !== "PAID" && a.applicationStatus !== "CONFIRMED")
        throw new ApiError(
          "Lớp chưa ở trạng thái có thể hoàn thành.",
          "INVALID_STATE",
          409,
        );
      a.applicationStatus = "FINISHED";
      const other = me.id === a.tutor.id ? a.student.id : a.tutor.id;
      notify(other, {
        notificationType: "APPLICATION",
        title: "Lớp đã hoàn thành",
        content: `Lớp "${a.post.title}" đã được đánh dấu hoàn thành. Bạn có thể đánh giá.`,
      });
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/applications/${id}/finish`)
      .then((res) => res.data);
  },

  async declineOffer(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = findApp(id);
      if (payerTutorId(a) !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (a.applicationStatus !== "ACCEPTED") {
        throw new ApiError(
          "Cannot decline this application.",
          "INVALID_STATE",
          409,
        );
      }
      a.applicationStatus = "CANCELLED";
      for (const o of applications) {
        if (
          o.post.id === a.post.id &&
          o.id !== a.id &&
          o.applicationStatus === "REJECTED"
        ) {
          o.applicationStatus = "PENDING";
        }
      }
      notify(a.student.id, {
        notificationType: "APPLICATION",
        title: "Tutor declined the offer",
        content: `Your post "${a.post.title}" is open for new applicants.`,
      });
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/applications/${id}/decline`)
      .then((res) => res.data);
  },

  async cancelApplication(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = findApp(id);
      if (a.tutor.id !== me.id || a.applicationStatus !== "PENDING") {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      }
      a.applicationStatus = "CANCELLED";
      return a;
    }
    return http
      .post<ApplicationResponse>(`/v1/applications/${id}/cancel`)
      .then((res) => res.data);
  },
};
