import { type ReactNode, useState } from 'react'

interface TooltipProps {
  content?: string
  /** alias của content */
  text?: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const sideClass = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
}

export function Tooltip({ content, text, children, side = 'top' }: TooltipProps) {
  const label = content ?? text
  if (!label) return <>{children}</>
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-text px-2.5 py-1 text-xs text-bg shadow-lg ${sideClass[side]}`}
        >
          {label}
        </div>
      )}
    </div>
  )
}
