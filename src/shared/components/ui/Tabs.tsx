import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface TabItem<T extends string> {
  value: T
  label: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ items, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-primary-light p-1">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              active ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
