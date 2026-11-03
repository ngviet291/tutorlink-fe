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
  category?: string;
}

export type SubjectSummaryResponse = Pick<SubjectResponse, "id" | "name">;
