import { Star } from 'lucide-react'

interface RatingStarsProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showValue?: boolean
  count?: number
}

const sizeClass = { sm: 'size-3', md: 'size-4', lg: 'size-5' }

export function RatingStars({ value, max = 5, size = 'sm', className = '', showValue = false, count }: RatingStarsProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClass[size]} ${
            i < Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-border'
          }`}
        />
      ))}
      {showValue && <span className="ml-1 text-xs font-semibold text-text">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="ml-0.5 text-xs text-text-secondary">({count})</span>}
    </div>
  )
}
