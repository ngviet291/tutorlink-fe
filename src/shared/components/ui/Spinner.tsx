import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const sizeClass = { sm: 'size-4', md: 'size-6', lg: 'size-10' } as const

export function Spinner({ className, size = 'md' }: { className?: string; size?: keyof typeof sizeClass }) {
  return <Loader2 role="status" aria-label="Đang tải" className={cn(sizeClass[size], 'animate-spin text-primary', className)} />
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
