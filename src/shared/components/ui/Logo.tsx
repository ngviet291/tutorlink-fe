import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/shared/utils/cn'

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to={ROUTES.HOME} className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
        <GraduationCap className="size-5" />
      </span>
      <span className={cn('text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-text')}>
        Tutor<span className={light ? 'text-secondary' : 'text-primary'}>Link</span>
      </span>
    </Link>
  )
}
