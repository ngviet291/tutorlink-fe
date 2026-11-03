import type { SubjectRequest } from "./subject.dto";

export interface SubjectResponse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  usageCount?: number;
}

export interface SubjectPayload {
  name: string;
  description?: string;
  category: SubjectRequest["category"];
}
export interface SubjectPageParams {
  cursor?: string;
  limit?: number;
}
export type SubjectSummaryResponse = Pick<SubjectResponse, "id" | "name">;
