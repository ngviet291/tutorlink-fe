import { mockConfig } from "@/config/env";
import { ApiError, type CursorResponse } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  TutorFilter,
  TutorProfilePayload,
  TutorResponse,
} from "../types/tutor.types";
import {
  notifications,
  nextId,
  recountSubjectUsage,
  subjects,
  tutors,
} from "@/mocks/db";
import { delay, cursorPaginate, requireUser } from "@/mocks/session";
import { http } from "@/config/axiosClient";

const USE_MOCK = mockConfig.tutor;

export const tutorService = {
  /** Chỉ hồ sơ APPROVED được hiển thị công khai. */
  async getTutors(
    params: TutorFilter = {},
  ): Promise<CursorResponse<TutorResponse>> {
    if (USE_MOCK) {
      await delay();
      const list = tutors
        .filter((t) => t.verificationStatus === "APPROVED")
        .filter(
          (t) =>
            !params.subjectName ||
            t.subject?.name
              .toLowerCase()
              .includes(params.subjectName.toLowerCase()),
        )
        .filter(
          (t) =>
            !params.province ||
            t.address?.province
              ?.toLowerCase()
              .includes(params.province.toLowerCase()),
        )
        .filter(
          (t) => params.minRate === undefined || t.hourlyRate >= params.minRate,
        )
        .filter(
          (t) => params.maxRate === undefined || t.hourlyRate <= params.maxRate,
        )
        .filter(
          (t) =>
            params.minRating === undefined ||
            t.averageRating >= params.minRating,
        )
        .sort((a, b) => b.averageRating - a.averageRating);
      return cursorPaginate(
        list,
        params.cursor,
        (t) => t.id,
        params.limit ?? 10,
      );
    }
    return http
      .get<CursorResponse<TutorResponse>>("/v1/users/tutors/search", params)
      .then((res) => res.data);
  },

  async getTutorById(id: string): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay(250);
      const t = tutors.find((x) => x.id === id);
      let canSeeAll = false;
      try {
        const me = requireUser();
        canSeeAll = me.role === "ADMIN" || me.id === id;
      } catch {
        /* guest */
      }
      if (!t || (t.verificationStatus !== "APPROVED" && !canSeeAll)) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }
      return t;
    }
    return http
      .get<TutorResponse>(`/v1/users/${id}/public-profile`)
      .then((res) => res.data);
  },

  async getMyProfile(): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay(250);
      const me = requireUser();
      const t = tutors.find((x) => x.id === me.id);
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      return t;
    }
    return http
      .get<TutorResponse>("/v1/users/me/tutor-profile")
      .then((res) => res.data);
  },

  async saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const t = tutors.find((x) => x.id === me.id);
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      const subject = subjects.find((s) => s.id === payload.subjectId);
      if (subject) t.subject = { id: subject.id, name: subject.name };
      t.experienceYears = payload.experienceYears;
      t.education = payload.education;
      t.hourlyRate = payload.hourlyRate;
      t.bio = payload.bio;
      t.address = payload.address;
      if (t.verificationStatus !== "APPROVED") {
        t.verificationStatus = "PENDING";
        t.verificationNote = undefined;
        notifications["a-1"] = [
          {
            id: nextId("n"),
            notificationType: "SYSTEM",
            title: "Hồ sơ gia sư mới chờ duyệt",
            content: `${t.fullName} vừa gửi hồ sơ giảng dạy.`,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...(notifications["a-1"] ?? []),
        ];
      }
      recountSubjectUsage();
      return t;
    }
    return http
      .put<TutorResponse>("/v1/users/me/tutor-profile", payload)
      .then((res) => res.data);
  },
};
