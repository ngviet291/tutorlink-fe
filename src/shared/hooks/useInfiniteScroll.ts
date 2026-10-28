import { useEffect, useRef } from 'react'

/** Gọi onReach khi phần tử sentinel xuất hiện trong viewport. */
export function useInfiniteScroll(onReach: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const cb = useRef(onReach)
  cb.current = onReach

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) cb.current()
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [enabled])

  return ref
}
