import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { delay } from "@/mocks/session";
import { subjects } from "@/mocks/db";
import type { CursorResponse } from "@/shared/types/api.types";
import type { SubjectResponse } from "../types/subject.types";

const USE_MOCK = mockConfig.subject;

export const subjectService = {
  async getAll(): Promise<SubjectResponse[]> {
    if (USE_MOCK) {
      await delay(200);
      return subjects;
    }

    // Backend trả CursorResponse<T>, không phải SubjectResponse[] trực tiếp.
    const response = await http.get<CursorResponse<SubjectResponse>>(
      "/v1/subjects",
      { params: { limit: 50 } },
    );
    return response.data.content ?? [];
  },
};
