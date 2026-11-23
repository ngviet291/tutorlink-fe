import type { createBrowserRouter } from 'react-router-dom'
import { trackingService } from './tracking.container'
import type { TrackingIdentity } from './service/tracking.service'
import { TRACKING } from './constants'
import type { TrackingEvent, TrackingEventName, TrackingPropsMap } from './types/tracking.types'

type AppRouter = ReturnType<typeof createBrowserRouter>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const ENABLED = import.meta.env.VITE_TRACKING_ENABLED !== 'false'
const GA_ID = import.meta.env.VITE_GA_ID
const configuredFlushSeconds = Number(import.meta.env.VITE_TRACKING_FLUSH_SECONDS)
const FLUSH_SECONDS = configuredFlushSeconds > 0
  ? configuredFlushSeconds
  : TRACKING.defaultFlushSeconds
const FLUSH_MS = FLUSH_SECONDS * 1000

let queue: QueuedEvent[] = []
let sending: Promise<void> | null = null
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

interface QueuedEvent {
  event: TrackingEvent
  identity: Promise<TrackingIdentity>
  attempts: number
}

function scheduleFlush(delay: number) {
  if (!timer) {
    timer = setTimeout(() => { void flush() }, delay)
  }
}

async function sendQueuedEvents() {
  while (queue.length && queue[0]!.attempts < TRACKING.maxAttempts) {
    const identity = await queue[0]!.identity
    const batch: QueuedEvent[] = []
    for (const entry of queue.slice(0, TRACKING.maxBatch)) {
      const owner = await entry.identity
      if (owner.subject !== identity.subject) {
        break
      }
      const payload = {
        anonId: getAnonId(),
        sessionId: getSessionId(),
        events: [...batch.map((item) => item.event), entry.event],
      }
      if (new TextEncoder().encode(JSON.stringify(payload)).length > TRACKING.maxBodyBytes) {
        break
      }
      batch.push(entry)
    }
    if (!batch.length) {
      queue.shift()
      continue
    }
    queue.splice(0, batch.length)
    try {
      await trackingService.sendEvents({
        anonId: getAnonId(),
        sessionId: getSessionId(),
        events: batch.map((entry) => entry.event),
      }, identity)
    } catch {
      batch.forEach((entry) => { entry.attempts++ })
      queue = [...batch, ...queue].slice(0, TRACKING.maxQueue)
      break
    }
  }
}

/** Gửi tuần tự; giữ batch bị lỗi và giới hạn số lần tự động gửi lại. */
export function flush(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (sending) {
    return sending
  }
  sending = sendQueuedEvents().finally(() => {
    sending = null
    if (queue.length && queue[0]!.attempts < TRACKING.maxAttempts) {
      scheduleFlush(TRACKING.retryDelayMs)
    }
  })
  return sending
}

export function track<K extends TrackingEventName>(name: K, props: TrackingPropsMap[K]) {
  if (!ENABLED || queue.length >= TRACKING.maxQueue) {
    return
  }
  const event: TrackingEvent = {
    id: crypto.randomUUID(),
    name,
    ts: new Date().toISOString(),
    props: JSON.parse(JSON.stringify(props)),
  }
  mirrorToGa(event)
  queue.push({ event, identity: trackingService.captureIdentity(), attempts: 0 })
  if (queue.length >= TRACKING.maxBatch) {
    void flush()
  } else {
    scheduleFlush(FLUSH_MS)
  }
}

const reportedErrors = new Set<string>()

export function trackClientError(message: string) {
  const path = window.location.pathname
  const key = JSON.stringify([path, message])
  if (!ENABLED || errorCount >= TRACKING.maxErrors || reportedErrors.has(key)) {
    return
  }
  reportedErrors.add(key)
  errorCount++
  track('client_error', { message: message.slice(0, TRACKING.maxErrorLength), path })
}

let initialized = false

export function initTracking(router: AppRouter) {
  if (!ENABLED || initialized) {
    return
  }
  initialized = true
  initGa()

  let lastPath = ''
  const seenRouteErrors = new WeakSet<object>()
  const onNavigate = () => {
    const { location, navigation, errors } = router.state
    if (errors) {
      Object.values(errors).forEach((error) => {
        if (error && typeof error === 'object' && !seenRouteErrors.has(error)) {
          seenRouteErrors.add(error)
          trackClientError(error instanceof Error ? error.message : 'Route rendering failed')
        }
      })
    }
    if (navigation.state !== 'idle' || location.pathname === lastPath) {
      return
    }
    const referrer = lastPath || document.referrer
    lastPath = location.pathname
    track('page_view', { path: location.pathname, referrer })
  }
  onNavigate()
  router.subscribe(onNavigate)

  window.addEventListener('error', (event) => {
    if (event.message) {
      trackClientError(event.message)
    }
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    trackClientError(reason instanceof Error ? reason.message : String(reason))
  })
  window.addEventListener('pagehide', () => { void flush() })
  window.addEventListener('online', () => {
    queue.forEach((entry) => { entry.attempts = 0 })
    void flush()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush()
    }
  })
}
