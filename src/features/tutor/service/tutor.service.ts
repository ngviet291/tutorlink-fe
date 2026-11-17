import type { CursorResponse } from "@/shared/types/api.types";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import type { TutorGateway } from "../api/tutor.gateway";
import type {
  TutorFilter,
  TutorProfilePayload,
  TutorResponse,
} from "../types/tutor.types";
export class TutorService {
  private readonly gateway: TutorGateway;

  constructor(gateway: TutorGateway) {
    this.gateway = gateway;
  }

  getTutors(params: TutorFilter = {}): Promise<CursorResponse<TutorResponse>> {
    return this.gateway.getTutors(params);
  }

  getTutorById(id: string): Promise<TutorResponse> {
    return this.gateway.getTutorById(id);
  }

  getMyProfile(): Promise<TutorResponse> {
    return this.gateway.getMyProfile();
  }

  saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
    return this.gateway.saveMyProfile(payload);
  }

  getMyCertificates(): Promise<CertificateResponse[]> {
    return this.gateway.getMyCertificates();
  }

  uploadCertificates(files: File[]): Promise<CertificateResponse[]> {
    return this.gateway.uploadCertificates(files);
  }

  deleteCertificate(id: string): Promise<void> {
    return this.gateway.deleteCertificate(id);
  }
}
