import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 role="status" aria-label="Đang tải" className={cn('size-6 animate-spin text-primary', className)} />
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-10" />
    </div>
  )
}
