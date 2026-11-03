import { publicHttp } from '@/config/axiosClient'
import { mockConfig } from '@/config/env'
import type { TrackingBatchPayload } from '../types/tracking.types'

const USE_MOCK = mockConfig.tracking ?? false

export const trackingService = {
  async sendEvents(payload: TrackingBatchPayload): Promise<void> {
    if (USE_MOCK) {
      console.log('📊 [MOCK] Tracking events:', payload)
      return
    }
    
    // Gọi API thật với publicHttp (backend đã permitAll)
    try {
      await publicHttp.post('/v1/tracking/events', payload)
    } catch (error) {
      // Fail silent - tracking không làm crash app
      if (import.meta.env.DEV) {
        console.warn('⚠️ Tracking failed:', error)
      }
    }
  },
}
