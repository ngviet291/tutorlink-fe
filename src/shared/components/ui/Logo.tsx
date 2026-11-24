import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/shared/utils/cn'

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-9 shrink-0', className)}>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <path d="M30 21 Q20 14.5 9 17.5 L9 30.5 Q20 27.5 30 34 Z" fill="#fff" />
      <path d="M34 21 Q44 14.5 55 17.5 L55 30.5 Q44 27.5 34 34 Z" fill="#fff" />
      <rect x="27.5" y="30" width="9" height="26" rx="4.5" fill="#fff" />
    </svg>
  )
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      to={ROUTES.HOME}
      aria-label="TutorLink"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <LogoMark />
      <span className={cn('text-xl tracking-tight', light ? 'text-white' : 'text-text')}>
        <span className="font-bold">Tutor</span>
        <span className={cn('font-normal', light ? 'text-secondary' : 'text-primary')}>Link</span>
      </span>
    </Link>
  )
}