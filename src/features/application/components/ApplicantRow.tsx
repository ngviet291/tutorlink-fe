import { Link } from 'react-router-dom'
import { Clock, MessageSquare } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { MaskedContact } from '@/shared/components/ui/MaskedContact'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { formatVnd } from '@/shared/utils/currency'
import { timeAgo } from '@/shared/utils/date'
import { isTutorApplicant, type ApplicationResponse } from '../types/application.types'

interface Props {
  application: ApplicationResponse
  canSelect: boolean
  onSelect: (a: ApplicationResponse) => void
  showAi?: boolean
}

export function ApplicantRow({ application: a, canSelect, onSelect, showAi }: Props) {
  const applicant = a.applicant
  const tutor = isTutorApplicant(applicant) ? applicant : null

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {showAi && a.aiRank !== undefined && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white" aria-label={`Hạng ${a.aiRank}`}>
              {a.aiRank}
            </span>
          )}
          <Avatar name={applicant.fullName} src={applicant.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-text">{applicant.fullName}</span>
              <StatusBadge kind="application" status={a.status} />
              {showAi && a.aiScore !== undefined && <Badge tone="orange">Phù hợp {a.aiScore}%</Badge>}
            </div>
            {tutor ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                <RatingStars value={tutor.averageRating} showValue count={tutor.reviewCount} />
                <span>{tutor.experienceYears} năm KN</span>
                <span className="font-semibold text-primary">{formatVnd(tutor.hourlyRate)}/giờ</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-text-secondary">Học viên{'city' in applicant && applicant.city ? ` · ${applicant.city}` : ''}</p>
            )}
            {tutor && <div className="mt-2 flex flex-wrap gap-1">{tutor.subjects.map((s) => <SubjectTag key={s.id} name={s.name} />)}</div>}
            {showAi && a.aiReason && <p className="mt-2 rounded-lg bg-primary-light px-3 py-1.5 text-xs text-text">💡 {a.aiReason}</p>}
            {a.message && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-text-secondary"><MessageSquare className="mt-0.5 size-4 shrink-0" /> {a.message}</p>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary"><Clock className="size-3.5" /> Đăng ký {timeAgo(a.createdAt)}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          {tutor && (
            <Link to={ROUTES.TUTOR_DETAIL(tutor.id)}>
              <Button variant="outline" size="sm" fullWidth>Xem hồ sơ</Button>
            </Link>
          )}
          {canSelect && a.status === 'PENDING' && (
            <Button size="sm" onClick={() => onSelect(a)}>Chọn ứng viên</Button>
          )}
          {a.paid && (
            <Link to={ROUTES.CHAT(a.id)}><Button size="sm" variant="secondary" fullWidth>Mở chat</Button></Link>
          )}
        </div>
      </div>

      {a.status === 'ACCEPTED' && a.awaitingPayment && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Đang chờ gia sư thanh toán phí nhận lớp. Nếu quá hạn hoặc bị từ chối, bạn có thể chọn ứng viên khác.
        </p>
      )}
      {a.status === 'ACCEPTED' && a.paid && <MaskedContact className="mt-3" contact={applicant.contact} />}
    </li>
  )
}
