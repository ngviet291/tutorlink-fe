import type { ReactNode } from 'react'

interface TooltipProps {
  text?: string
  children: ReactNode
}

/** Tooltip nhẹ bằng CSS, hiển thị khi hover/focus. Không hiển thị gì nếu text rỗng. */
export function Tooltip({ text, children }: TooltipProps) {
  if (!text) return <>{children}</>
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-1.5 text-center text-xs text-white shadow-lg group-focus-within:block group-hover:block"
      >
        {text}
      </span>
    </span>
  )
}
