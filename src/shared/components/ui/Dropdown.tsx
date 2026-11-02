import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/utils/cn'

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  /** Dạng danh sách mục đơn giản. */
  items?: DropdownItem[]
  /** Dạng nội dung tuỳ ý; nhận hàm `close` để đóng menu. */
  children?: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  className?: string
  /** aria-label cho nút mở menu. */
  triggerLabel?: string
}

export const dropdownItemClass =
  'flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-text hover:bg-surface-hover'

export function Dropdown({ trigger, items, children, align = 'right', className, triggerLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center bg-transparent p-0"
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[160px] rounded-xl border border-border bg-surface py-1 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {items?.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={() => { item.onClick(); close() }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50',
                item.danger ? 'text-error' : 'text-text',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
