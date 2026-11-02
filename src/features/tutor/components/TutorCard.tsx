import { Link } from 'react-router-dom'
import { BadgeCheck, Briefcase, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { formatVnd } from '@/shared/utils/currency'
import type { TutorResponse } from '../types/tutor.types'

export function TutorCard({ tutor }: { tutor: TutorResponse }) {
  const { t } = useTranslation()

  return (
    <Link
      to={ROUTES.TUTOR_DETAIL(tutor.id)}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 truncate text-base font-bold text-text group-hover:text-primary">
            {tutor.fullName}
            {tutor.verificationStatus === 'APPROVED' && (
              <BadgeCheck className="size-4 shrink-0 text-info" aria-label={t('common.verified')} />
            )}
          </h3>
          <RatingStars value={tutor.averageRating} />
        </div>
      </div>

      {tutor.subject && (
        <div className="flex flex-wrap gap-1.5">
          <SubjectTag name={tutor.subject.name} />
        </div>
      )}

      <p className="line-clamp-2 text-sm text-text-secondary">{tutor.bio}</p>

      <div className="mt-auto flex flex-col gap-1.5 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Briefcase className="size-3.5" />
          {tutor.experienceYears} {t('common.experience')}
        </span>
        {tutor.address?.province && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {tutor.address.province}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-base font-bold text-primary">
          {formatVnd(tutor.hourlyRate)}
          <span className="text-xs font-normal text-text-secondary">{t('common.perHour')}</span>
        </span>
        <span className="text-sm font-semibold text-primary group-hover:underline">
          {t('tutor.viewProfile')}
        </span>
      </div>
    </Link>
  )
}
