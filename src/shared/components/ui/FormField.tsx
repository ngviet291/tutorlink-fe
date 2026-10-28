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
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  )
}

export const fieldBase =
  'w-full rounded-lg border bg-surface px-3 text-sm text-text placeholder:text-text-secondary/60 transition-colors ' +
  'focus:border-primary focus:outline-2 focus:outline-primary/30 disabled:cursor-not-allowed disabled:opacity-60'
