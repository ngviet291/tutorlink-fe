import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'
import { FormField, fieldBase } from './FormField'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, required, rows = 4, ...rest },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <FormField label={label} htmlFor={areaId} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(fieldBase, 'py-2', error ? 'border-danger' : 'border-border', className)}
        {...rest}
      />
    </FormField>
  )
})
