import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/useAppStore'
import { removeToast, type ToastItem, type ToastKind } from '@/shared/store/toastSlice'
import { cn } from '@/shared/utils/cn'

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors: Record<ToastKind, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
}

function ToastView({ toast }: { toast: ToastItem }) {
  const dispatch = useAppDispatch()
  const Icon = icons[toast.kind]

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(toast.id)), 4000)
    return () => clearTimeout(t)
  }, [dispatch, toast.id])

  return (
    <div
      role="status"
      className="flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-lg"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', colors[toast.kind])} />
      <p className="flex-1 text-sm text-text">{toast.message}</p>
      <button
        type="button"
        aria-label="Đóng thông báo"
        className="cursor-pointer text-text-secondary hover:text-text"
        onClick={() => dispatch(removeToast(toast.id))}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const items = useAppSelector((s) => s.toast.items)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-4">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full justify-center sm:justify-end">
          <ToastView toast={t} />
        </div>
      ))}
    </div>
  )
}
