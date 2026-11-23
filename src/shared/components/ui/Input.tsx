import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { FormField, fieldBase } from './FormField'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, className, id, required, type, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  // Ô mật khẩu tự có nút con mắt để bật/tắt hiển thị
  const isPassword = type === 'password'
  const [visible, setVisible] = useState(false)
  return (
    <FormField label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          className={cn(
            fieldBase,
            'h-10',
            error ? 'border-danger' : 'border-border',
            leftIcon ? 'pl-10' : undefined,
            isPassword ? 'pr-10' : undefined,
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary hover:text-text"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </FormField>
  )
})
