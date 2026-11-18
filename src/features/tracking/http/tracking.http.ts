import { TRACKING } from '../constants'

/** Gửi tracking độc lập, không làm mới token hoặc xóa phiên đăng nhập. */
export class TrackingHttpClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async post(path: string, payload: unknown, token: string | null): Promise<void> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TRACKING.timeoutMs)
    try {
      const response = await fetch(this.baseUrl + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
        keepalive: true,
        signal: controller.signal,
      })
      if (!response.ok) {
        throw Object.assign(new Error('Tracking HTTP ' + response.status), {
          status: response.status,
        })
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
