import type { createBrowserRouter } from 'react-router-dom'
import { trackingService } from './service/tracking.service'
import type { TrackingEvent, TrackingEventName, TrackingPropsMap } from './types/tracking.types'

type AppRouter = ReturnType<typeof createBrowserRouter>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const ENABLED = import.meta.env.VITE_TRACKING_ENABLED === 'true'
const GA_ID = import.meta.env.VITE_GA_ID
const FLUSH_SECONDS = Number(import.meta.env.VITE_TRACKING_FLUSH_SECONDS) || 300
const FLUSH_MS = FLUSH_SECONDS * 1000
const MAX_BATCH = 50
const MAX_ERRORS_PER_SESSION = 20

let queue: TrackingEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let anonId = ''
let sessionId = ''
let errorCount = 0

function getOrCreateId(storage: Storage, key: string): string {
  const saved = storage.getItem(key)
  if (saved) return saved
  const id = crypto.randomUUID()
  storage.setItem(key, id)
  return id
}

// anonId: giữ lâu dài trên trình duyệt (localStorage)
function getAnonId(): string {
  if (!anonId) {
    try { anonId = getOrCreateId(localStorage, 'tl_anon_id') } catch { anonId = crypto.randomUUID() }
  }
  return anonId
}

// sessionId: mỗi tab một phiên (sessionStorage)
function getSessionId(): string {
  if (!sessionId) {
    try { sessionId = getOrCreateId(sessionStorage, 'tl_sid') } catch { sessionId = crypto.randomUUID() }
  }
  return sessionId
}

function initGa() {
  if (!GA_ID || window.gtag) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    // GA cần đúng đối tượng arguments, không phải mảng
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false }) // SPA: tự gửi page_view

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

// GA chỉ nhận giá trị chuỗi/số, nên object được chuyển thành chuỗi
function toGaParams(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue
    out[k] = typeof v === 'object' ? JSON.stringify(v).slice(0, 100) : v
  }
  return out
}

function mirrorToGa(e: TrackingEvent) {
  if (!window.gtag) return
  if (e.name === 'page_view') {
    window.gtag('event', 'page_view', {
      page_path: e.props.path,
      page_location: window.location.href,
      page_title: document.title,
    })
  } else {
    window.gtag('event', e.name, toGaParams(e.props))
  }
}

export async function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!queue.length) return
  const events = queue
  queue = []
  try {
    await trackingService.sendEvents({ anonId: getAnonId(), sessionId: getSessionId(), events })
  } catch {
    /* tracking lỗi thì bỏ qua, không làm phiền người dùng */
  }
}

export function track<K extends TrackingEventName>(name: K, props: TrackingPropsMap[K]) {
  if (!ENABLED) return
  const event: TrackingEvent = { name, ts: new Date().toISOString(), props: props as Record<string, unknown> }
  mirrorToGa(event)
  queue.push(event)
  if (queue.length >= MAX_BATCH) void flush()
  else if (!timer) timer = setTimeout(() => void flush(), FLUSH_MS)
}

export function trackClientError(message: string) {
  if (errorCount >= MAX_ERRORS_PER_SESSION) return // tránh spam khi lỗi lặp
  errorCount++
  track('client_error', { message: message.slice(0, 300), path: window.location.pathname })
}

/** Gọi một lần ở main.tsx. */
export function initTracking(router: AppRouter) {
  if (!ENABLED) return
  initGa()

  let lastPath = ''
  const onNavigate = () => {
    const { location, navigation } = router.state
    if (navigation.state !== 'idle' || location.pathname === lastPath) return
    const referrer = lastPath || document.referrer
    lastPath = location.pathname
    track('page_view', { path: location.pathname, referrer })
  }
  onNavigate()
  router.subscribe(onNavigate)

  window.addEventListener('error', (e) => {
    if (e.message) trackClientError(e.message)
  })
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    trackClientError(r instanceof Error ? r.message : String(r))
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
}