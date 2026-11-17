import { users } from "@/mocks/db";
import { delay } from "@/mocks/session";
import { ApiError } from "@/shared/types/api.types";
import type { StudentResponse } from "@/features/user/types/user.dto";
import type { StudentGateway } from "./student.gateway";

export class MockStudentGateway implements StudentGateway {
  async getPublicProfile(id: string): Promise<StudentResponse> {
    await delay(200);
    const u = users.find((x) => x.id === id && x.role === "STUDENT");
    if (!u) throw new ApiError("Không tìm thấy học viên", "NOT_FOUND", 404);
    return { ...u, role: u.role, userStatus: u.userStatus } as StudentResponse;
  }
}
