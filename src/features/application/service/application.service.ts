import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { ApiError, type CursorResponse } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  ApplicationResponse,
  AiSuggestionResponse,
  ApplyPayload,
  PostApplicationItem,
  AiRankedApplication,
} from "../types/application.types";
import type {
  ApplicationResponse as ApplicationDto,
  RankedApplicationsResponse,
  ScoredApplicationResponse,
} from "../types/application.dto";
import type { BaseUserResponse } from "@/features/user/types/user.dto";
import type { PostResponse } from "@/features/post/types/post.types";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { StudentResponse } from "@/features/user/types/user.types";
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

/**
 * BE ApplicationResponse chỉ có ID liên kết.
 * FE UI cũ cần object post/tutor/student nên service ghép dữ liệu tại đây.
 */
async function getPublicUser(id: string): Promise<BaseUserResponse> {
  return http
    .get<BaseUserResponse>(`/v1/users/${id}/public-profile`)
    .then((res) => res.data);
}

function asStudent(user: BaseUserResponse): StudentResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    userStatus: user.userStatus,
    role: user.role as StudentResponse["role"],
    grade: undefined,
    learningGoal: undefined,
  };
}

function asTutor(user: BaseUserResponse): TutorResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    experienceYears: 0,
    hourlyRate: 0,
    averageRating: 0,
    verificationStatus: "PENDING",
    address: user.address,
  };
}

async function enrichApplication(
  dto: ApplicationDto,
): Promise<ApplicationResponse> {
  const [post, student, tutor] = await Promise.all([
    http.get<PostResponse>(`/v1/posts/${dto.postId}`).then((res) => res.data),
    getPublicUser(dto.studentId),
    getPublicUser(dto.tutorId),
  ]);

  return {
    id: dto.id,
    post,
    student: asStudent(student),
    tutor: asTutor(tutor),
    applicationStatus: dto.applicationStatus,
    message: dto.message,
    proposedFee: dto.proposedFee,
    appliedAt: dto.appliedAt,
    processedByAdminId: dto.processedByAdminId,
    transactionId: dto.transactionId,
  };
}

async function enrichApplications(
  items: ApplicationDto[],
): Promise<ApplicationResponse[]> {
  return Promise.all(items.map(enrichApplication));
}

async function enrichPostApplicants(
  postId: string,
  items: PostApplicationItem[],
): Promise<ApplicationResponse[]> {
  const post = await http
    .get<PostResponse>(`/v1/posts/${postId}`)
    .then((res) => res.data);

  const postOwner = await getPublicUser(post.author.id);

  return Promise.all(
    items.map(async (item) => {
      const applicant = await getPublicUser(item.userId);
      const isTutorApplicant = post.type === "FIND_TUTOR";

      return {
        id: item.applicationId,
        post,
        tutor: isTutorApplicant ? asTutor(applicant) : asTutor(postOwner),
        student: isTutorApplicant ? asStudent(postOwner) : asStudent(applicant),
        applicationStatus: item.status,
        appliedAt: item.appliedAt,
      };
    }),
  );
}

function flattenRanked(data: RankedApplicationsResponse): ApplicationDto[] {
  return [...(data.top ?? []), ...(data.others ?? [])]
    .map((item: ScoredApplicationResponse) => item.application)
    .filter((item): item is ApplicationDto => Boolean(item));
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

    const dto = await http
      .post<ApplicationDto>("/v1/applications", payload)
      .then((res) => res.data);
    return enrichApplication(dto);
  },

  async getMyApplications(): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      return applications
        .filter((a) => a.tutor.id === me.id || a.student.id === me.id)
        .sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt));
    }

    // BE: GET /v1/applications/mine?cursor=&limit=
    const page = await http
      .get<CursorResponse<ApplicationDto>>("/v1/applications/mine", {
        params: { limit: 100 },
      })
      .then((res) => res.data);

    return enrichApplications(page.content);
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

    const myApplications = await this.getMyApplications();
    return myApplications.filter(
      (a) =>
        a.applicationStatus === "PAID" || a.applicationStatus === "FINISHED",
    );
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

    // BE trả PostApplicationResponse, không phải ApplicationResponse.
    const page = await http
      .get<
        CursorResponse<PostApplicationItem>
      >(`/v1/posts/${postId}/applications`, { params: { limit: 100 } })
      .then((res) => res.data);

    return enrichPostApplicants(postId, page.content);
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

    // BE: GET /v1/applications/post/{postId}/ranked
    const ranked = await http
      .get<RankedApplicationsResponse>(`/v1/applications/post/${postId}/ranked`)
      .then((res) => res.data);

    const scored = [...(ranked.top ?? []), ...(ranked.others ?? [])];

    const items: AiRankedApplication[] = (
      await Promise.all(
        scored.map(async (item, index) => {
          if (!item.application) {
            return null;
          }

          const app = await enrichApplication(item.application);

          const result: AiRankedApplication = {
            ...app,
            aiRank: index + 1,
            aiScore: item.score,
            aiReason: item.warnings?.join(", "),
          };

          return result;
        }),
      )
    ).filter((item): item is AiRankedApplication => item !== null);

    return {
      items,
      source: "AI",
    };
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
    const dto = await http
      .post<ApplicationDto>(`/v1/applications/${id}/select`)
      .then((res) => res.data);
    return enrichApplication(dto);
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
    await http.post(`/v1/payments/applications/${id}/pay`);

    const updated = await http
      .get<ApplicationDto>(`/v1/applications/${id}`)
      .then((res) => res.data);
    return enrichApplication(updated);
  },

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
    const dto = await http
      .post<ApplicationDto>(`/v1/applications/${id}/confirm`)
      .then((res) => res.data);
    return enrichApplication(dto);
  },

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
    const dto = await http
      .post<ApplicationDto>(`/v1/applications/${id}/finish`)
      .then((res) => res.data);
    return enrichApplication(dto);
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
    const dto = await http
      .post<ApplicationDto>(`/v1/applications/${id}/cancel`)
      .then((res) => res.data);
    return enrichApplication(dto);
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
    const dto = await http
      .post<ApplicationDto>(`/v1/applications/${id}/cancel`)
      .then((res) => res.data);
    return enrichApplication(dto);
  },
};
