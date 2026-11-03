import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { delay } from "@/mocks/session";
import { subjects } from "@/mocks/db";
import type { SubjectResponse } from "../types/subject.types";

const USE_MOCK = mockConfig.subject;

export const subjectService = {
  async getAll(): Promise<SubjectResponse[]> {
    if (USE_MOCK) {
      await delay(200);
      return subjects;
    }
    const response = await http.get<SubjectResponse[]>("/v1/subjects");
    return response.data;
  },
};
