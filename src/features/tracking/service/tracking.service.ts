import type { ITokenStorage } from '@/config/storage/types'
import type { TrackingGateway } from '../api/tracking.gateway'
import type { TrackingBatchPayload } from '../types/tracking.types'
import { TRACKING } from '../constants'

export interface TrackingIdentity {
  subject: string | null
  accessToken: string | null
  expiresAt?: number
}

interface TrackingTokenRefresher {
  refresh(): Promise<string>
}

export class TrackingService {
  private readonly gateway: TrackingGateway
  private readonly tokens: ITokenStorage
  private readonly useMock: boolean
  private readonly refresher?: TrackingTokenRefresher

  constructor(
    gateway: TrackingGateway,
    tokens: ITokenStorage,
    useMock: boolean,
    refresher?: TrackingTokenRefresher,
  ) {
    this.gateway = gateway
    this.tokens = tokens
    this.useMock = useMock
    this.refresher = refresher
  }

  async captureIdentity(): Promise<TrackingIdentity> {
    try {
      const accessToken = await this.tokens.getAccessToken()
      if (!accessToken) {
        return { subject: null, accessToken: null }
      }
      const encoded = accessToken.split('.')[1] ?? ''
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
      if (typeof payload.sub === 'string' && payload.sub) {
        return {
          subject: payload.sub,
          accessToken,
          expiresAt: typeof payload.exp === 'number' && Number.isFinite(payload.exp)
            ? payload.exp
            : undefined,
        }
      }
    } catch {
      // Nếu không đọc được nơi lưu token, vẫn cho phép ghi nhận truy cập của khách.
    }
    return { subject: null, accessToken: null }
  }

  async sendEvents(payload: TrackingBatchPayload, identity: TrackingIdentity): Promise<void> {
    if (this.useMock) {
      return
    }
    const current = await this.captureIdentity()
    // Chỉ dùng token mới nếu vẫn thuộc tài khoản đã tạo sự kiện.
    let token = current.subject === identity.subject
      ? current.accessToken
      : identity.accessToken
    const sameAccount = identity.subject !== null && current.subject === identity.subject
    let refreshed = false
    if (
      token && sameAccount && this.refresher && current.expiresAt !== undefined
      && current.expiresAt * 1000 - Date.now() <= TRACKING.tokenExpirySkewSeconds * 1000
    ) {
      token = await this.refreshFor(identity)
      refreshed = true
    }
    try {
      await this.gateway.send(payload, token)
    } catch (error) {
      const unauthorized = error !== null && typeof error === 'object'
        && 'status' in error && error.status === 401
      if (!unauthorized || !token || !sameAccount || refreshed || !this.refresher) {
        throw error
      }
      // Chỉ gửi lại một lần; không xóa phiên hoặc đổi sự kiện thành truy cập của khách.
      const refreshedToken = await this.refreshFor(identity)
      await this.gateway.send(payload, refreshedToken)
    }
  }

  private async refreshFor(identity: TrackingIdentity): Promise<string> {
    const before = await this.captureIdentity()
    if (!this.refresher || !identity.subject || before.subject !== identity.subject) {
      throw new Error('Không thể làm mới tracking cho tài khoản đã đổi phiên')
    }
    const token = await this.refresher.refresh()
    const after = await this.captureIdentity()
    if (after.subject !== identity.subject) {
      throw new Error('Tài khoản đã thay đổi trong khi làm mới tracking')
    }
    return token
  }
}
