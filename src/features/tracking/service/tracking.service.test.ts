import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrackingService } from './tracking.service'
import { HttpTrackingGateway } from '../api/http.tracking.gateway'
import { TrackingHttpClient } from '../http/tracking.http'

const payload = { anonId: 'anon', sessionId: 'tab', events: [] }
const makeToken = (sub: string, revision = 1) =>
  'header.' + btoa(JSON.stringify({ sub, revision })) + '.signature'

const httpError = (status: number) => Object.assign(new Error('Tracking HTTP ' + status), { status })

function tokenStore() {
  return {
    getAccessToken: vi.fn().mockResolvedValue(null),
    getRefreshToken: vi.fn(),
    saveAccessToken: vi.fn(),
    saveRefreshToken: vi.fn(),
    clear: vi.fn(),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('nhận diện người tạo sự kiện', () => {
  it('làm mới token hết hạn trước khi gửi tracking', async () => {
    const tokens = tokenStore()
    const expired = 'header.' + btoa(JSON.stringify({ sub: 'member', exp: 0 })) + '.signature'
    tokens.getAccessToken.mockResolvedValue(expired)
    const refreshed = makeToken('member', 2)
    const refresh = vi.fn().mockImplementation(async () => {
      tokens.getAccessToken.mockResolvedValue(refreshed)
      return refreshed
    })
    const send = vi.fn().mockResolvedValue(undefined)
    const service = new TrackingService({ send }, tokens, { refresh })
    await service.sendEvents(payload, await service.captureIdentity())
    expect(refresh).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledExactlyOnceWith(payload, refreshed)
  })

  it('không refresh khi request của khách trả 401', async () => {
    const tokens = tokenStore()
    const refresh = vi.fn()
    const send = vi.fn().mockRejectedValue(httpError(401))
    const service = new TrackingService({ send }, tokens, { refresh })
    await expect(service.sendEvents(payload, await service.captureIdentity())).rejects.toThrow('401')
    expect(refresh).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledExactlyOnceWith(payload, null)
  })

  it('không refresh token khi backend trả 500', async () => {
    const tokens = tokenStore()
    tokens.getAccessToken.mockResolvedValue(makeToken('member'))
    const refresh = vi.fn()
    const service = new TrackingService({ send: vi.fn().mockRejectedValue(httpError(500)) }, tokens, { refresh })
    await expect(service.sendEvents(payload, await service.captureIdentity())).rejects.toThrow('500')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('giữ lỗi refresh và không đổi sự kiện thành khách hoặc xóa phiên', async () => {
    const tokens = tokenStore()
    tokens.getAccessToken.mockResolvedValue(makeToken('member'))
    const refresh = vi.fn().mockRejectedValue(new Error('refresh failed'))
    const send = vi.fn().mockRejectedValue(httpError(401))
    const service = new TrackingService({ send }, tokens, { refresh })
    await expect(service.sendEvents(payload, await service.captureIdentity())).rejects.toThrow('refresh failed')
    expect(send).toHaveBeenCalledOnce()
    expect(tokens.clear).not.toHaveBeenCalled()
  })

  it('làm mới token đúng một lần khi tracking trả 401', async () => {
    const tokens = tokenStore()
    tokens.getAccessToken.mockResolvedValue(makeToken('member'))
    const refreshed = makeToken('member', 2)
    const refresh = vi.fn().mockResolvedValue(refreshed)
    const send = vi.fn().mockRejectedValueOnce(httpError(401)).mockResolvedValue(undefined)
    const service = new TrackingService({ send }, tokens, { refresh })
    const identity = await service.captureIdentity()
    await service.sendEvents(payload, identity)
    expect(refresh).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenLastCalledWith(payload, refreshed)
    expect(tokens.clear).not.toHaveBeenCalled()
  })

  it('không lặp refresh nếu request gửi lại vẫn trả 401', async () => {
    const tokens = tokenStore()
    tokens.getAccessToken.mockResolvedValue(makeToken('member'))
    const refresh = vi.fn().mockResolvedValue(makeToken('member', 2))
    const send = vi.fn().mockRejectedValue(httpError(401))
    const service = new TrackingService({ send }, tokens, { refresh })
    await expect(service.sendEvents(payload, await service.captureIdentity())).rejects.toThrow('401')
    expect(refresh).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledTimes(2)
    expect(tokens.clear).not.toHaveBeenCalled()
  })

  it('không dùng phiên hiện tại để làm mới sự kiện của tài khoản cũ', async () => {
    const tokens = tokenStore()
    tokens.getAccessToken.mockResolvedValue(makeToken('original'))
    const refresh = vi.fn()
    const service = new TrackingService({ send: vi.fn().mockRejectedValue(httpError(401)) }, tokens, { refresh })
    const identity = await service.captureIdentity()
    tokens.getAccessToken.mockResolvedValue(makeToken('another'))
    await expect(service.sendEvents(payload, identity)).rejects.toThrow('401')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('không gán sự kiện của khách cho tài khoản vừa đăng nhập', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tokens = tokenStore()
    const service = new TrackingService({ send }, tokens)
    const identity = await service.captureIdentity()
    tokens.getAccessToken.mockResolvedValue(makeToken('member'))
    await service.sendEvents(payload, identity)
    expect(send).toHaveBeenCalledWith(payload, null)
  })

  it('chỉ dùng token mới của cùng tài khoản', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const tokens = tokenStore()
    const original = makeToken('original')
    const refreshed = makeToken('original', 2)
    tokens.getAccessToken.mockResolvedValue(original)
    const service = new TrackingService({ send }, tokens)
    const identity = await service.captureIdentity()
    tokens.getAccessToken.mockResolvedValue(refreshed)
    await service.sendEvents(payload, identity)
    expect(send).toHaveBeenLastCalledWith(payload, refreshed)
    tokens.getAccessToken.mockResolvedValue(makeToken('another'))
    await service.sendEvents(payload, identity)
    expect(send).toHaveBeenLastCalledWith(payload, original)
  })

  it('trả lỗi cho hàng đợi xử lý mà không xóa phiên đăng nhập', async () => {
    const tokens = tokenStore()
    const service = new TrackingService({
      send: vi.fn().mockRejectedValue(new Error('offline')),
    }, tokens)
    await expect(service.sendEvents(payload, {
      subject: null, accessToken: null,
    })).rejects.toThrow('offline')
    expect(tokens.clear).not.toHaveBeenCalled()
  })

})

describe('hợp đồng HTTP tracking', () => {
  it('dùng đúng endpoint, keepalive và token tùy chọn', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetch)
    const gateway = new HttpTrackingGateway(new TrackingHttpClient('/api'))
    await gateway.send(payload, null)
    expect(fetch.mock.calls[0]![0]).toBe('/api/v1/tracking/events')
    expect(fetch.mock.calls[0]![1]).toMatchObject({ keepalive: true, credentials: 'omit' })
    expect(fetch.mock.calls[0]![1].headers.Authorization).toBeUndefined()
    await gateway.send(payload, 'test-token')
    expect(fetch.mock.calls[1]![1].headers.Authorization).toBe('Bearer test-token')
  })

  it('không xem HTTP lỗi là gửi thành công', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const gateway = new HttpTrackingGateway(new TrackingHttpClient('/api'))
    await expect(gateway.send(payload, null)).rejects.toMatchObject({ status: 500 })
  })
})
