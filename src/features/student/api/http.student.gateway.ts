import type { IHttpClient } from "@/config/http/IHttpClient";
import type { StudentResponse } from "@/features/user/types/user.dto";
import type { StudentGateway } from "./student.gateway";

export class HttpStudentGateway implements StudentGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  getPublicProfile(id: string): Promise<StudentResponse> {
    return this.http.get<StudentResponse>(`/v1/users/${id}/public-profile`);
  }
}
