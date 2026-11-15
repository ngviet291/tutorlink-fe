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
import { http, publicHttp } from "@/config/axiosClient";
import {
  toTutor,
  toUpdateTutorProfileRequest,
} from "@/features/user/mapper/user.mapper";
import type {
  CertificateResponse,
  TutorResponse as TutorResponseDto,
} from "@/features/user/types/user.dto";

const USE_MOCK = mockConfig.tutor;
/** Hồ sơ của chính gia sư (getMyProfile / saveMyProfile) có cờ riêng để nối API trước. */
const USE_MOCK_PROFILE = mockConfig.tutorProfile;

const CERTIFICATES_PATH = "/v1/users/me/certificates";
const MOCK_REVIEW_DELAY_MS = 3000;
/** Chứng chỉ mock theo từng gia sư (chỉ dùng khi chạy mock). */
const mockCertificates = new Map<string, CertificateResponse[]>();

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
    // Endpoint public: dùng publicHttp để token hỏng/hết hạn không làm khách bị đăng xuất
    return publicHttp
      .get<CursorResponse<TutorResponseDto>>("/v1/users/tutors/search", {
        params,
      })
      .then((res) => ({
        content: (res.data.content ?? []).map(toTutor),
        hasNext: res.data.hasNext ?? false,
        nextCursor: res.data.nextCursor,
      }));
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
    return publicHttp
      .get<TutorResponseDto>(`/v1/users/${id}/public-profile`)
      .then((res) => toTutor(res.data));
  },

  /** GET /v1/users/me — với tài khoản TUTOR, BE trả về TutorResponse. */
  async getMyProfile(): Promise<TutorResponse> {
    if (USE_MOCK_PROFILE) {
      await delay(250);
      const me = requireUser();
      const t = tutors.find((x) => x.id === me.id);
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      return t;
    }
    return http
      .get<TutorResponseDto>("/v1/users/me")
      .then((res) => toTutor(res.data));
  },

  /** GET /v1/users/me/certificates */
  async getMyCertificates(): Promise<CertificateResponse[]> {
    if (USE_MOCK_PROFILE) {
      await delay(200);
      return [...(mockCertificates.get(requireUser().id) ?? [])];
    }
    return http
      .get<CertificateResponse[]>(CERTIFICATES_PATH)
      .then((res) => res.data);
  },

  /**
   * POST /v1/users/me/certificates (multipart, part "certificates").
   * BE duyệt ảnh bằng AI bất đồng bộ: kết quả trả về luôn có verified=false.
   */
  async uploadCertificates(files: File[]): Promise<CertificateResponse[]> {
    if (USE_MOCK_PROFILE) {
      await delay(400);
      const meId = requireUser().id;
      const created: CertificateResponse[] = files.map((file) => ({
        id: nextId("cert"),
        fileUrl: URL.createObjectURL(file),
        verified: false,
      }));
      mockCertificates.set(meId, [
        ...created,
        ...(mockCertificates.get(meId) ?? []),
      ]);
      // Giả lập AI duyệt xong sau vài giây
      setTimeout(() => {
        mockCertificates.set(
          meId,
          (mockCertificates.get(meId) ?? []).map((c) =>
            created.some((n) => n.id === c.id)
              ? { ...c, verified: true, name: "Chứng chỉ đã xác thực" }
              : c,
          ),
        );
      }, MOCK_REVIEW_DELAY_MS);
      return created;
    }
    const form = new FormData();
    files.forEach((file) => form.append("certificates", file));
    return http
      .post<CertificateResponse[]>(CERTIFICATES_PATH, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  /** DELETE /v1/users/me/certificates/{id} */
  async deleteCertificate(id: string): Promise<void> {
    if (USE_MOCK_PROFILE) {
      await delay(200);
      const meId = requireUser().id;
      mockCertificates.set(
        meId,
        (mockCertificates.get(meId) ?? []).filter((c) => c.id !== id),
      );
      return;
    }
    await http.delete(`${CERTIFICATES_PATH}/${id}`);
  },

  /** PUT /v1/users/me/tutor-profile — BE nhận `subjectIds`, `teachingAreas`... (xem mapper). */
  async saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
    if (USE_MOCK_PROFILE) {
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
      if (payload.address) t.address = payload.address;
      t.teachingMode = payload.teachingMode;
      t.educationLevels = payload.educationLevels;
      t.teachingAreas = payload.teachingAreas;
      t.schedule = payload.schedule;
      if (t.verificationStatus !== "APPROVED") {
        t.verificationStatus = "PENDING";
        t.verificationNote = undefined;
        notifications["a-1"] = [
          {
            id: nextId("n"),
            notificationType: "SYSTEM",
            title: "Hồ sơ gia sư mới chờ duyệt",
            content: `${t.fullName} vừa gửi hồ sơ giảng dạy.`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...(notifications["a-1"] ?? []),
        ];
      }
      recountSubjectUsage();
      return t;
    }
    return http
      .put<TutorResponseDto>(
        "/v1/users/me/tutor-profile",
        toUpdateTutorProfileRequest(payload),
      )
      .then((res) => toTutor(res.data));
  },
};
