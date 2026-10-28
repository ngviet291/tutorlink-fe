import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import type { BadgeTone } from '@/constants/enums'

const tones: Record<BadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
  darkGray: 'bg-gray-300 text-gray-900 dark:bg-gray-600/40 dark:text-gray-200',
  green: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  orange: 'bg-primary-light text-primary',
}

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
  icon?: ReactNode
}

export function Badge({ tone = 'gray', className, children, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
