import { Star } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface RatingStarsProps {
  value: number
  size?: 'sm' | 'md'
  showValue?: boolean
  count?: number
}

export function RatingStars({ value, size = 'sm', showValue = true, count }: RatingStarsProps) {
  const dim = size === 'sm' ? 'size-4' : 'size-5'
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Đánh giá ${value.toFixed(1)} trên 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(dim, i <= Math.round(value) ? 'fill-warning text-warning' : 'text-border')}
          />
        ))}
      </span>
      {showValue && <span className="text-sm font-semibold text-text">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-text-secondary">({count})</span>}
    </span>
  )
}

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div role="radiogroup" aria-label="Chọn số sao" className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} sao`}
          onClick={() => onChange(i)}
          className="cursor-pointer"
        >
          <Star className={cn('size-7', i <= value ? 'fill-warning text-warning' : 'text-border')} />
        </button>
      ))}
    </div>
  )
}
