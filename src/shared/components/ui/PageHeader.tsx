interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  /** alias của action */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-extrabold text-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {(action ?? actions) && <div className="shrink-0">{action ?? actions}</div>}
    </div>
  )
}
