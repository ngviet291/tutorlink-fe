import type { IHttpClient } from "@/config/http/IHttpClient";
import type { CursorResponse } from "@/shared/types/api.types";
import {
  toTutor,
  toUpdateTutorProfileRequest,
} from "@/features/user/mapper/user.mapper";
import type {
  CertificateResponse,
  TutorResponse as TutorResponseDto,
} from "@/features/user/types/user.dto";
import type {
  TutorFilter,
  TutorProfilePayload,
  TutorResponse,
} from "../types/tutor.types";
import type { TutorGateway } from "./tutor.gateway";

const USERS = "/v1/users";
const CERTIFICATES = `${USERS}/me/certificates`;

export class HttpTutorGateway implements TutorGateway {
  private readonly publicHttp: IHttpClient;
  private readonly privateHttp: IHttpClient;

  constructor(publicHttp: IHttpClient, privateHttp: IHttpClient) {
    this.publicHttp = publicHttp;
    this.privateHttp = privateHttp;
  }

  async getTutors(
    params: TutorFilter = {},
  ): Promise<CursorResponse<TutorResponse>> {
    const res = await this.publicHttp.get<CursorResponse<TutorResponseDto>>(
      `${USERS}/tutors/search`,
      { params },
    );
    return {
      content: (res.content ?? []).map(toTutor),
      hasNext: res.hasNext ?? false,
      nextCursor: res.nextCursor,
    };
  }

  async getTutorById(id: string): Promise<TutorResponse> {
    return toTutor(
      await this.publicHttp.get<TutorResponseDto>(
        `${USERS}/${id}/public-profile`,
      ),
    );
  }

  /** GET /v1/users/me — với tài khoản TUTOR, BE trả về TutorResponse. */
  async getMyProfile(): Promise<TutorResponse> {
    return toTutor(await this.privateHttp.get<TutorResponseDto>(`${USERS}/me`));
  }

  /** PUT /v1/users/me/tutor-profile — BE nhận `subjectIds`, `teachingAreas`... (xem mapper). */
  async saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
    return toTutor(
      await this.privateHttp.put<TutorResponseDto>(
        `${USERS}/me/tutor-profile`,
        toUpdateTutorProfileRequest(payload),
      ),
    );
  }

  getMyCertificates(): Promise<CertificateResponse[]> {
    return this.privateHttp.get<CertificateResponse[]>(CERTIFICATES);
  }
  uploadCertificates(files: File[]): Promise<CertificateResponse[]> {
    const form = new FormData();
    files.forEach((file) => form.append("certificates", file));
    return this.privateHttp.post<CertificateResponse[]>(CERTIFICATES, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async deleteCertificate(id: string): Promise<void> {
    await this.privateHttp.delete(`${CERTIFICATES}/${id}`);
  }
}
