interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  tabs?: TabItem<T>[]
  /** alias của tabs */
  items?: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string>({ tabs: tabsProp, items, value, onChange, className = '' }: TabsProps<T>) {
  const tabs = tabsProp ?? items ?? []
  return (
    <div className={`flex gap-1 rounded-xl border border-border bg-surface p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            value === tab.value
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                value === tab.value ? 'bg-white/20' : 'bg-surface-secondary'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ items, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-primary-light p-1">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
