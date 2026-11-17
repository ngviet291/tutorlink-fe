import type { TutorGateway } from "./tutor.gateway";

/**
 * Ghép 2 nguồn dữ liệu theo từng cờ mock độc lập:
 * - `query`: tìm / xem gia sư (mockConfig.tutor)
 * - `profile`: hồ sơ + chứng chỉ của chính gia sư (mockConfig.tutorProfile)
 */
export class CompositeTutorGateway implements TutorGateway {
  private readonly query: TutorGateway;
  private readonly profile: TutorGateway;

  constructor(query: TutorGateway, profile: TutorGateway) {
    this.query = query;
    this.profile = profile;
  }

  getTutors: TutorGateway["getTutors"] = (p) => this.query.getTutors(p);
  getTutorById: TutorGateway["getTutorById"] = (id) =>
    this.query.getTutorById(id);
  getMyProfile: TutorGateway["getMyProfile"] = () => this.profile.getMyProfile();
  saveMyProfile: TutorGateway["saveMyProfile"] = (p) =>
    this.profile.saveMyProfile(p);
  getMyCertificates: TutorGateway["getMyCertificates"] = () =>
    this.profile.getMyCertificates();
  uploadCertificates: TutorGateway["uploadCertificates"] = (f) =>
    this.profile.uploadCertificates(f);
  deleteCertificate: TutorGateway["deleteCertificate"] = (id) =>
    this.profile.deleteCertificate(id);
}
