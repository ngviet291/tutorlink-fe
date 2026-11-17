import type { TrackingGateway } from './tracking.gateway'
import type { TrackingHttpClient } from '../http/tracking.http'
import type { TrackingBatchPayload } from '../types/tracking.types'
import { TRACKING } from '../constants'

export class HttpTrackingGateway implements TrackingGateway {
  private readonly http: TrackingHttpClient

  constructor(http: TrackingHttpClient) {
    this.http = http
  }

  send(payload: TrackingBatchPayload, token: string | null): Promise<void> {
    return this.http.post(TRACKING.endpoint, payload, token)
  }
}