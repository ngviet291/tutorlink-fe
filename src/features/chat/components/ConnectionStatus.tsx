import { useRealtimeStatus } from '@/shared/realtime/useRealtimeStatus'
import { cn } from '@/shared/utils/cn'
import type { RealtimeStatus } from '@/config/realtime/realtime.types'

const LABEL: Record<RealtimeStatus, string> = {
  connected: 'Đã kết nối',
  connecting: 'Đang kết nối...',
  disconnected: 'Mất kết nối, đang thử lại',
  error: 'Lỗi kết nối',
}

const DOT: Record<RealtimeStatus, string> = {
  connected: 'bg-online',
  connecting: 'animate-pulse bg-yellow-400',
  disconnected: 'bg-text-secondary',
  error: 'bg-red-500',
}

/** Chấm + nhãn trạng thái kết nối realtime. */
export function ConnectionStatus({ className }: { className?: string }) {
  const status = useRealtimeStatus()
  return (
    <p role="status" className={cn('flex items-center gap-1 text-xs text-text-secondary', className)}>
      <span className={cn('size-2 rounded-full', DOT[status])} aria-hidden="true" />
      {LABEL[status]}
    </p>
  )
}
