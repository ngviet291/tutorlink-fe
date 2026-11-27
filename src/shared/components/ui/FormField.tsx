import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface FormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-danger-text">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs text-danger-text">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  )
}

export const fieldBase =
   'w-full rounded-lg border bg-surface px-3 text-base text-text placeholder:text-text-secondary/60 transition-colors sm:text-sm ' +
  'focus:border-primary focus:outline-2 focus:outline-primary/30 disabled:cursor-not-allowed disabled:opacity-60'
