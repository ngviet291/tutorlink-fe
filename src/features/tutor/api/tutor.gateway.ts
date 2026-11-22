import type { CursorResponse } from "@/shared/types/api.types";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import type {
  TutorFilter,
  TutorProfilePayload,
  TutorResponse,
} from "../types/tutor.types";
export interface TutorQueryGateway {
  getTutors(params?: TutorFilter): Promise<CursorResponse<TutorResponse>>;
  getTutorById(id: string): Promise<TutorResponse>;
}
export interface TutorProfileGateway {
  getMyProfile(): Promise<TutorResponse>;
  saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse>;
}

export interface TutorCertificateGateway {
  getMyCertificates(): Promise<CertificateResponse[]>;
  uploadCertificates(
    subjectId: string,
    files: File[],
  ): Promise<CertificateResponse[]>;

  deleteCertificate(id: string): Promise<void>;
}

export interface TutorGateway
  extends TutorQueryGateway, TutorProfileGateway, TutorCertificateGateway {}
