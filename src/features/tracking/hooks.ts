import { useEffect, useRef } from 'react'
import { track } from './tracker'

interface ProfileOrigin {
  section?: 'TOP' | 'OTHERS'
  rank?: number
}

/** Ghi tutor_profile_viewed khi rời trang hồ sơ, kèm thời gian xem (chỉ tính lúc tab đang hiển thị). */
export function useTutorProfileTracking(tutorId: string | undefined, origin?: ProfileOrigin) {
  const originRef = useRef(origin)
  originRef.current = origin

  useEffect(() => {
    if (!tutorId) return
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

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (since !== null) visibleMs += performance.now() - since
      const dwellMs = Math.round(visibleMs)
      if (dwellMs < 300) return // bỏ qua lần chạy kép của React StrictMode khi dev
      track('tutor_profile_viewed', {
        tutorId,
        section: originRef.current?.section,
        rank: originRef.current?.rank,
        dwellMs,
      })
    }
  }, [tutorId])
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
  const last = useRef('')

  useEffect(() => {
    if (!active || !ready || last.current === key) return
    last.current = key
    track('search_performed', { query, filters, resultCount })
  }, [active, ready, key, query, filters, resultCount])
}

let postFormCompleted = false

/** Gọi khi đăng hoặc lưu bài thành công. */
export function markPostFormCompleted() {
  postFormCompleted = true
  track('post_form_step', { step: 1, status: 'COMPLETED' })
}

/** Ghi ABANDONED nếu rời trang khi đã nhập nhưng chưa đăng/lưu thành công. */
export function usePostFormAbandonTracking(isDirty: boolean) {
  const dirtyRef = useRef(isDirty)
  dirtyRef.current = isDirty

  useEffect(() => {
    postFormCompleted = false
    return () => {
      if (dirtyRef.current && !postFormCompleted) {
        track('post_form_step', { step: 1, status: 'ABANDONED' })
      }
    }
  }, [])
}