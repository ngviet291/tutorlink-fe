import { env } from '@/config/env'
import { tokenStorage, tokenRefresher } from '@/config/di/container'
import { HttpTrackingGateway } from './api/http.tracking.gateway'
import { TrackingHttpClient } from './http/tracking.http'
import { TrackingService } from './service/tracking.service'

// Khởi tạo dependency tại feature để không sửa DI container dùng chung.
export const trackingService = new TrackingService(
  new HttpTrackingGateway(new TrackingHttpClient(env.apiBaseUrl)),
  tokenStorage,
  tokenRefresher,
)
