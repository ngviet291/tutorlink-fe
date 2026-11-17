import type { StudentResponse } from "@/features/user/types/user.dto";

export interface StudentGateway {
  getPublicProfile(id: string): Promise<StudentResponse>;
}
