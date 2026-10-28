export interface SubjectSummaryResponse {
  id: string
  name: string
}

export interface SubjectResponse extends SubjectSummaryResponse {
  description?: string
  usageCount: number
}

export interface SubjectPayload {
  name: string
  description?: string
}
