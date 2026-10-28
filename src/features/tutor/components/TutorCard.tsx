import { Link } from 'react-router-dom'
import { BadgeCheck, Briefcase, Lock, MapPin } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { TEACHING_MODE_LABEL } from '@/constants/enums'
import { Avatar } from '@/shared/components/ui/Avatar'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { formatVnd } from '@/shared/utils/currency'
import { LOCKED_PHONE } from '@/shared/utils/maskContact'
import type { TutorResponse } from '../types/tutor.types'

export function TutorCard({ tutor }: { tutor: TutorResponse }) {
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
            {tutor.profileStatus === 'APPROVED' && <BadgeCheck className="size-4 shrink-0 text-info" aria-label="Đã xác minh" />}
          </h3>
          <RatingStars value={tutor.averageRating} count={tutor.reviewCount} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects.map((s) => (
          <SubjectTag key={s.id} name={s.name} />
        ))}
      </div>

      <p className="line-clamp-2 text-sm text-text-secondary">{tutor.bio}</p>

      <div className="mt-auto flex flex-col gap-1.5 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Briefcase className="size-3.5" /> {tutor.experienceYears} năm kinh nghiệm
          {tutor.teachingMode && ` · ${TEACHING_MODE_LABEL[tutor.teachingMode]}`}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {[tutor.district, tutor.city].filter(Boolean).join(', ')}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <Lock className="size-3.5 text-primary" /> {tutor.maskedPhone ?? LOCKED_PHONE}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-base font-bold text-primary">
          {formatVnd(tutor.hourlyRate)}
          <span className="text-xs font-normal text-text-secondary">/giờ</span>
        </span>
        <span className="text-sm font-semibold text-primary group-hover:underline">Xem hồ sơ</span>
      </div>
    </Link>
  )
}
