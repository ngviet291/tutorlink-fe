import type { TrackingBatchPayload } from '../types/tracking.types'

export interface TrackingGateway {
  send(payload: TrackingBatchPayload, token: string | null): Promise<void>
}