export interface TrackingPropsMap {
  page_view: { path: string; referrer: string }
  application_list_opened: { postId: string; applicantCount: number; ranked: boolean }
  tutor_profile_viewed: {
    tutorId: string
    section?: 'TOP' | 'OTHERS'
    rank?: number
    dwellMs: number
  }
  tutor_favorited: { tutorId: string; source: string }
  search_performed: { query: string; filters: Record<string, unknown>; resultCount: number }
  post_form_step: { step: number; status: 'COMPLETED' | 'ABANDONED' }
  client_error: { message: string; path: string }
}

export type TrackingEventName = keyof TrackingPropsMap

export interface TrackingEvent {
  name: TrackingEventName
  ts: string
  props: Record<string, unknown>
}

export interface TrackingBatchPayload {
  anonId: string
  sessionId: string
  events: TrackingEvent[]
}