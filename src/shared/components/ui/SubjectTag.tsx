import { cn } from '@/shared/utils/cn'

export function SubjectTag({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary',
        className,
      )}
    >
      {name}
    </span>
  )
}
