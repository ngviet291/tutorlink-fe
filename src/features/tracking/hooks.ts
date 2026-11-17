import { useEffect, useLayoutEffect, useRef } from 'react'
import { flush, track } from './tracker'
import { TRACKING } from './constants'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'

// Xuất lại hàm ghi nhận sự kiện để các hook và component cùng sử dụng.
export { track }

interface ProfileOrigin {
  section?: 'TOP' | 'OTHERS'
  rank?: number
}

/** Ghi tutor_profile_viewed khi rời trang hồ sơ, kèm thời gian xem (chỉ tính lúc tab đang hiển thị). */
export function useTutorProfileTracking(tutorId: string | undefined, origin?: ProfileOrigin) {
  const originRef = useRef(origin)
  useLayoutEffect(() => {
    originRef.current = origin
  }, [origin])

  useEffect(() => {
    if (!tutorId) return
    const source = originRef.current
    let emitted = false
    let visibleMs = 0
    let since: number | null = document.visibilityState === 'visible' ? performance.now() : null

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (since !== null) visibleMs += performance.now() - since
        since = null
      } else {
        since = performance.now()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const emitView = () => {
      if (emitted) {
        return
      }
      if (since !== null) {
        visibleMs += performance.now() - since
        since = null
      }
      const dwellMs = Math.round(visibleMs)
      if (dwellMs < TRACKING.minDwellMs) return
      emitted = true
      track('tutor_profile_viewed', {
        tutorId,
        section: source?.section,
        rank: source?.rank,
        dwellMs,
      })
      void flush()
    }
    window.addEventListener('pagehide', emitView)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', emitView)
      emitView()
    }
  }, [tutorId])
}

/** Đọc cờ phân trang từ đúng query tìm kiếm, không đoán tổng kết quả từ số dòng đã tải. */
function getSearchHasMore(queryClient: QueryClient, key: string): boolean | undefined {
  let params: unknown
  try {
    params = JSON.parse(key)
  } catch {
    return undefined
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return undefined
  }
  const keys = [queryKeys.tutors.list(params), queryKeys.posts.list(params)]
  for (const queryKey of keys) {
    const data = queryClient.getQueryData<{ pages: Array<{ hasNext: boolean }> }>(queryKey)
    const hasMore = data?.pages?.at(-1)?.hasNext
    if (typeof hasMore === 'boolean') {
      return hasMore
    }
  }
  return undefined
}

/** Ghi search_performed một lần cho mỗi bộ tìm kiếm khác nhau, sau khi kết quả đã tải xong. */
export function useSearchTracking(opts: {
  active: boolean
  ready: boolean
  key: string
  query: string
  filters: Record<string, unknown>
  resultCount: number
}) {
  const { active, ready, key, query, filters, resultCount } = opts
  const queryClient = useQueryClient()
  const last = useRef('')

  useEffect(() => {
    if (!active) {
      last.current = ''
      return
    }
    if (!ready || last.current === key) return
    const hasMore = getSearchHasMore(queryClient, key)
    if (hasMore === undefined) {
      return
    }
    last.current = key
    track('search_performed', {
      query,
      filters,
      resultCount,
      resultCountScope: TRACKING.resultCountScope,
      hasMore,
    })
  }, [active, ready, key, query, filters, resultCount, queryClient])
}

let postFormCompleted = false

/** Gọi khi đăng hoặc lưu bài thành công. */
export function markPostFormCompleted() {
  postFormCompleted = true
  track('post_form_step', { step: TRACKING.formStep, status: 'COMPLETED' })
}

/** Ghi ABANDONED nếu rời trang khi đã nhập nhưng chưa đăng/lưu thành công. */
export function usePostFormAbandonTracking(isDirty: boolean) {
  const dirtyRef = useRef(isDirty)
  useLayoutEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    postFormCompleted = false
    let emitted = false
    const emitAbandoned = () => {
      if (dirtyRef.current && !postFormCompleted && !emitted) {
        emitted = true
        track('post_form_step', { step: TRACKING.formStep, status: 'ABANDONED' })
        void flush()
      }
    }
    window.addEventListener('pagehide', emitAbandoned)
    return () => {
      window.removeEventListener('pagehide', emitAbandoned)
      emitAbandoned()
    }
  }, [])
}
