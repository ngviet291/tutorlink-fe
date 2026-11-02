import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  maxWidth?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const SIZE_CLASS = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const

export function Modal({ open, onClose, title, children, className = '', maxWidth, size = 'md', footer }: ModalProps) {
  const widthClass = maxWidth ?? SIZE_CLASS[size]
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto ${widthClass} rounded-2xl border border-border bg-surface p-6 shadow-2xl ${className}`}
        role="dialog"
        aria-modal
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-secondary"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-secondary"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        )}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
