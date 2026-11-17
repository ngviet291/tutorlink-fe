import { ApiError, type CursorResponse } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import {
  notifications,
  nextId,
  recountSubjectUsage,
  subjects,
  tutors,
} from "@/mocks/db";
import { delay, cursorPaginate, requireUser } from "@/mocks/session";
import type {
  TutorFilter,
  TutorProfilePayload,
  TutorResponse,
} from "../types/tutor.types";
import type { TutorGateway } from "./tutor.gateway";

const MOCK_REVIEW_DELAY_MS = 3000;
export class MockTutorGateway implements TutorGateway {
  private readonly certificates = new Map<string, CertificateResponse[]>();

  async getTutors(
    params: TutorFilter = {},
  ): Promise<CursorResponse<TutorResponse>> {
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
          params.minRating === undefined || t.averageRating >= params.minRating,
      )
      .sort((a, b) => b.averageRating - a.averageRating);
    return cursorPaginate(list, params.cursor, (t) => t.id, params.limit ?? 10);
  }

  async getTutorById(id: string): Promise<TutorResponse> {
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

  async getMyProfile(): Promise<TutorResponse> {
    await delay(250);
    const me = requireUser();
    const t = tutors.find((x) => x.id === me.id);
    if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
    return t;
  }

  async saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
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

  async getMyCertificates(): Promise<CertificateResponse[]> {
    await delay(200);
    return [...(this.certificates.get(requireUser().id) ?? [])];
  }

  async uploadCertificates(files: File[]): Promise<CertificateResponse[]> {
    await delay(400);
    const meId = requireUser().id;
    const created: CertificateResponse[] = files.map((file) => ({
      id: nextId("cert"),
      fileUrl: URL.createObjectURL(file),
      verified: false,
    }));
    this.certificates.set(meId, [
      ...created,
      ...(this.certificates.get(meId) ?? []),
    ]);
    // Giả lập AI duyệt xong sau vài giây
    setTimeout(() => {
      this.certificates.set(
        meId,
        (this.certificates.get(meId) ?? []).map((c) =>
          created.some((n) => n.id === c.id)
            ? { ...c, verified: true, name: "Chứng chỉ đã xác thực" }
            : c,
        ),
      );
    }, MOCK_REVIEW_DELAY_MS);
    return created;
  }

  async deleteCertificate(id: string): Promise<void> {
    await delay(200);
    const meId = requireUser().id;
    this.certificates.set(
      meId,
      (this.certificates.get(meId) ?? []).filter((c) => c.id !== id),
    );
  }
}
