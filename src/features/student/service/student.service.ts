import { ApiError } from "@/shared/types/api.types";
import type { StudentResponse } from "@/features/user/types/user.dto";
import type { StudentGateway } from "../api/student.gateway";
export class StudentService {
  private readonly gateway: StudentGateway;

  constructor(gateway: StudentGateway) {
    this.gateway = gateway;
  }
  async getStudentPublicProfile(id: string): Promise<StudentResponse> {
    const profile = await this.gateway.getPublicProfile(id);
    if (String(profile.role).replace(/^ROLE_/i, "") !== "STUDENT") {
      throw new ApiError("Không tìm thấy học viên", "NOT_FOUND", 404);
    }
    return profile;
  }
}
