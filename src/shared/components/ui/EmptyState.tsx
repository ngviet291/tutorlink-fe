import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode | { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-2 text-text-tertiary opacity-40">{icon}</div>
      )}
      <p className="text-base font-semibold text-text">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-text-secondary">{description}</p>
      )}
      {action && (isActionObject(action) ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : (
        <div className="mt-2">{action}</div>
      ))}
    </div>
  )
}

function isActionObject(a: unknown): a is { label: string; onClick: () => void } {
  return typeof a === 'object' && a !== null && 'label' in a && 'onClick' in a && !('$$typeof' in a)
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-center ${className}`}>
      <div className="mb-2 text-red-400 opacity-70">
        <AlertCircle className="w-10 h-10" />
      </div>
      <p className="text-base font-semibold text-text">{message ?? t('common.error')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
