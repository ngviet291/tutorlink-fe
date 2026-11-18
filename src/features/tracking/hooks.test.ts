// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  markPostFormCompleted, usePostFormAbandonTracking,
  useSearchTracking, useTutorProfileTracking,
} from './hooks'

const mocks = vi.hoisted(() => ({ track: vi.fn(), flush: vi.fn() }))
vi.mock('./tracker', () => ({
  track: mocks.track,
  flush: mocks.flush,
}))

let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  mocks.track.mockReset()
  mocks.flush.mockReset().mockResolvedValue(undefined)
  root = createRoot(document.createElement('div'))
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})
afterEach(async () => {
  await act(() => root.unmount())
  vi.restoreAllMocks()
})

it('ghi lại cùng điều kiện tìm kiếm sau khi người dùng đã xóa bộ lọc', async () => {
  const client = new QueryClient()
  const params = { subjectName: 'subject', limit: 12 }
  client.setQueryData(queryKeys.tutors.list(params), {
    pages: [{ content: [], hasNext: true }],
    pageParams: [undefined],
  })
  function Search({ active }: { active: boolean }) {
    useSearchTracking({
      active, ready: true, key: JSON.stringify(params), query: 'subject',
      filters: {}, resultCount: 2,
    })
    return null
  }
  const renderSearch = (active: boolean) => root.render(createElement(
    QueryClientProvider, { client }, createElement(Search, { active }),
  ))
  await act(() => renderSearch(true))
  await act(() => renderSearch(true))
  expect(mocks.track).toHaveBeenCalledTimes(1)
  expect(mocks.track).toHaveBeenCalledWith('search_performed', {
    query: 'subject', filters: {}, resultCount: 2,
    resultCountScope: 'LOADED', hasMore: true,
  })
  await act(() => renderSearch(false))
  await act(() => renderSearch(true))
  expect(mocks.track).toHaveBeenCalledTimes(2)
  client.clear()
})

it('lấy hasMore từ trang cuối của kết quả tìm bài đăng', async () => {
  const client = new QueryClient()
  const params = { type: 'FIND_TUTOR', keyword: 'subject', limit: 12 }
  client.setQueryData(queryKeys.posts.list(params), {
    pages: [{ content: [], hasNext: true }, { content: [], hasNext: false }],
    pageParams: [undefined, 'cursor'],
  })
  function Search() {
    useSearchTracking({
      active: true, ready: true, key: JSON.stringify(params), query: 'subject',
      filters: { type: params.type }, resultCount: 15,
    })
    return null
  }
  await act(() => root.render(createElement(QueryClientProvider, { client }, createElement(Search))))
  expect(mocks.track).toHaveBeenCalledWith('search_performed', {
    query: 'subject', filters: { type: 'FIND_TUTOR' }, resultCount: 15,
    resultCountScope: 'LOADED', hasMore: false,
  })
  client.clear()
})

it('gửi thời gian xem khi pagehide, không tính lúc tab ẩn và không phát lại khi unmount', async () => {
  let now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  function Profile() {
    useTutorProfileTracking('tutor', { section: 'TOP', rank: 1 })
    return null
  }
  await act(() => root.render(createElement(Profile)))
  now = 1000
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
  document.dispatchEvent(new Event('visibilitychange'))
  now = 5000
  window.dispatchEvent(new Event('pagehide'))
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith('tutor_profile_viewed', {
    tutorId: 'tutor', section: 'TOP', rank: 1, dwellMs: 1000,
  })
  await act(() => root.render(null))
  expect(mocks.track).toHaveBeenCalledTimes(1)
})

it('ghi bỏ dở khi pagehide đúng một lần', async () => {
  function Form() {
    usePostFormAbandonTracking(true)
    return null
  }
  await act(() => root.render(createElement(Form)))
  window.dispatchEvent(new Event('pagehide'))
  await act(() => root.render(null))
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith('post_form_step', {
    step: 1, status: 'ABANDONED',
  })
})

it('giữ API hoàn thành form hiện có và không ghi bỏ dở sau đó', async () => {
  function Form() {
    usePostFormAbandonTracking(true)
    return null
  }
  await act(() => root.render(createElement(Form)))
  markPostFormCompleted()
  window.dispatchEvent(new Event('pagehide'))
  await act(() => root.render(null))
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith('post_form_step', {
    step: 1, status: 'COMPLETED',
  })
})
