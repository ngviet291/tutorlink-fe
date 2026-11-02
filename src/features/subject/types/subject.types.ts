export interface SubjectResponse {
  id: string
  name: string
  description?: string
  usageCount?: number
}

export interface SubjectPayload {
  name: string
  description?: string
}

export type SubjectSummaryResponse = Pick<SubjectResponse, 'id' | 'name'>
