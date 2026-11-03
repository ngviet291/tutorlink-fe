import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useAiTop5 } from '../hooks/useApplications'
import { ApplicantRow } from './ApplicantRow'
import type { ApplicationResponse } from '../types/application.types'
import { RANK_MIN_PENDING } from '../rank'

interface Props {
  postId: string
  canSelect: boolean
  onSelect: (a: ApplicationResponse) => void
  pendingCount: number
}

export function AiTop5Panel({ postId, canSelect, onSelect, pendingCount }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useAiTop5(postId, pendingCount >= RANK_MIN_PENDING)

  if (pendingCount < RANK_MIN_PENDING) return null

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary-light/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="font-extrabold text-primary">{t('ai.top5Title')}</h2>
        {data?.source && (
          <Badge tone={data.source === 'AI' ? 'blue' : 'gray'}>
            {data.source === 'AI' ? t('ai.sourceAi') : t('ai.sourceRule')}
          </Badge>
        )}
      </div>
      <p className="mb-4 text-xs text-text-secondary">{t('ai.top5Desc')}</p>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : isError ? (
        <p className="text-sm text-danger">{t('ai.unavailable')}</p>
      ) : data?.items.length ? (
        <ul className="flex flex-col gap-2">
          {data.items.map((a) => (
            <ApplicantRow key={a.id} application={a} canSelect={canSelect} onSelect={onSelect} showAi />
          ))}
        </ul>
      ) : null}
    </section>
  )
}
