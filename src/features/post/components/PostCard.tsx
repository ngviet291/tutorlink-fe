import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Users, Wifi } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { EDUCATION_LEVEL_LABEL, POST_TYPE_LABEL, TEACHING_MODE_LABEL } from '@/constants/enums'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { formatBudgetRange } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import type { PostResponse } from '../types/post.types'

export function PostCard({ post }: { post: PostResponse }) {
  return (
    <Link
      to={ROUTES.POST_DETAIL(post.id)}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={post.type === 'FIND_TUTOR' ? 'orange' : 'blue'}>{POST_TYPE_LABEL[post.type]}</Badge>
          <SubjectTag name={post.subject.name} />
        </div>
        <StatusBadge kind="post" status={post.status} />
      </div>

      <h3 className="line-clamp-2 text-base font-bold text-text group-hover:text-primary">{post.title}</h3>
      <p className="line-clamp-2 text-sm text-text-secondary">{post.content}</p>

      <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-text-secondary">
        <div className="col-span-2 text-sm font-bold text-primary">
          {formatBudgetRange(post.minBudget, post.maxBudget)}
          <span className="font-normal text-text-secondary"> /tháng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{post.address.district}, {post.address.city}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="size-3.5 shrink-0" />
          {TEACHING_MODE_LABEL[post.teachingMode]}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {post.sessionsPerWeek} buổi/tuần · {post.durationMinutes}'
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          Hạn {formatDate(post.deadline)}
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={post.author.fullName} src={post.author.avatarUrl} size="sm" />
          <span className="truncate text-xs font-medium text-text">{post.author.fullName}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-text-secondary">
          <Badge tone="gray">{EDUCATION_LEVEL_LABEL[post.educationLevel]}</Badge>
          {post.applicationCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {post.applicationCount}
            </span>
          )}
        </span>
      </div>
    </Link>
  )
}
