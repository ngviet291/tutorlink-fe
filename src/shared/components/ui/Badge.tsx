import type { ReactNode } from 'react'
import type { BadgeTone } from '@/constants/enums'

interface BadgeProps {
  tone?: BadgeTone | string
  children: ReactNode
  icon?: ReactNode
  className?: string
}

const toneClass: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-surface-secondary text-text-secondary',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export function Badge({ tone = 'gray', children, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone] ?? toneClass.gray} ${className}`}
    >
      {icon && <span className="mr-1 inline-flex">{icon}</span>}
      {children}
    </span>
  )
}
