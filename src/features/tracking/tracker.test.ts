// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const service = vi.hoisted(() => ({
  captureIdentity: vi.fn(),
  sendEvents: vi.fn(),
}))
vi.mock('./tracking.container', () => ({ trackingService: service }))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubEnv('VITE_TRACKING_ENABLED', 'true')
  vi.stubEnv('VITE_GA_ID', '')
  service.captureIdentity.mockReset().mockResolvedValue({ subject: null, accessToken: null })
  service.sendEvents.mockReset().mockResolvedValue(undefined)
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

it('giữ lại batch gửi lỗi để thử lại', async () => {
  const tracker = await import('./tracker')
  service.sendEvents.mockRejectedValueOnce(new Error('offline'))
  tracker.track('page_view', { path: '/', referrer: '' })
  await tracker.flush()
  const failedPayload = service.sendEvents.mock.calls[0]![0]
  expect(failedPayload.events[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  await tracker.flush()
  expect(service.sendEvents.mock.calls[1]![0]).toEqual(failedPayload)
})

it('tạo ID khác nhau cho từng sự kiện theo hợp đồng BE đang chạy', async () => {
  const tracker = await import('./tracker')
  tracker.track('page_view', { path: '/', referrer: '' })
  tracker.track('page_view', { path: '/find-tutor', referrer: '/' })
  await tracker.flush()
  const events = service.sendEvents.mock.calls[0]![0].events
  expect(events[0].id).toBeTypeOf('string')
  expect(events[1].id).toBeTypeOf('string')
  expect(events[0].id).not.toBe(events[1].id)
})

it('chia request theo giới hạn 50 sự kiện và theo người tạo', async () => {
  const tracker = await import('./tracker')
  for (let index = 0; index < 51; index++) {
    tracker.track('page_view', { path: '/page/' + index, referrer: '' })
  }
  await tracker.flush()
  expect(service.sendEvents.mock.calls.map((call) => call[0].events.length)).toEqual([50, 1])
  service.sendEvents.mockClear()
  service.captureIdentity
    .mockResolvedValueOnce({ subject: null, accessToken: null })
    .mockResolvedValueOnce({ subject: 'member', accessToken: 'test-token' })
  tracker.track('page_view', { path: '/guest', referrer: '' })
  tracker.track('page_view', { path: '/member', referrer: '' })
  await tracker.flush()
  expect(service.sendEvents.mock.calls.map((call) => call[1].subject)).toEqual([null, 'member'])
})

it('chụp lại props để thay đổi bộ lọc sau đó không làm sai dữ liệu đang chờ gửi', async () => {
  const tracker = await import('./tracker')
  const filters = { province: 'province-one' }
  tracker.track('search_performed', {
    query: '', filters, resultCount: 1,
    resultCountScope: 'LOADED', hasMore: false,
  })
  filters.province = 'province-two'
  await tracker.flush()
  expect(service.sendEvents.mock.calls[0]![0].events[0].props.filters.province).toBe('province-one')
})

it('giới hạn tự động retry và không phát trùng cùng lỗi JavaScript', async () => {
  const tracker = await import('./tracker')
  service.sendEvents.mockRejectedValue(new Error('offline'))
  tracker.trackClientError('render failed')
  tracker.trackClientError('render failed')
  for (let attempt = 0; attempt < 4; attempt++) {
    await tracker.flush()
  }
  expect(service.sendEvents).toHaveBeenCalledTimes(3)
  expect(service.sendEvents.mock.calls[0]![0].events).toHaveLength(1)
})
