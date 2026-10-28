import { useState } from 'react'
import { cn } from '@/shared/utils/cn'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-28 text-4xl',
}

function initial(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase()
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <span
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary',
        sizes[size],
        className,
      )}
    >
      {initial(name)}
    </span>
  )
}
