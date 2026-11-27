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
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold text-text sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {(action ?? actions) && <div className="shrink-0">{action ?? actions}</div>}
    </div>
  )
}
