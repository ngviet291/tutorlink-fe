import {
  APPLICATION_STATUS_META,
  POST_STATUS_META,
  TRANSACTION_STATUS_META,
  VERIFICATION_STATUS_META,
  USER_STATUS_META,
  type BadgeTone,
} from '@/constants/enums'
import type {
  ApplicationStatus,
  PostStatus,
  TransactionStatus,
  UserStatus,
  VerificationStatus,
} from '@/shared/types/common.types'
import { Badge } from './Badge'

type StatusBadgeProps =
  | { kind: 'post'; status: PostStatus | string; className?: string }
  | { kind: 'application'; status: ApplicationStatus | string; className?: string }
  | { kind: 'verification'; status: VerificationStatus | string; className?: string }
  | { kind: 'transaction'; status: TransactionStatus | string; className?: string }
  | { kind: 'user'; status: UserStatus | string; className?: string }

function resolve(props: StatusBadgeProps): { label: string; tone: BadgeTone } {
  let meta: { label: string; tone: BadgeTone } | undefined

  switch (props.kind) {
    case 'post':
      meta = POST_STATUS_META[props.status as PostStatus]
      break
    case 'application':
      meta = APPLICATION_STATUS_META[props.status as ApplicationStatus]
      break
    case 'verification':
      meta = VERIFICATION_STATUS_META[props.status as VerificationStatus]
      break
    case 'transaction':
      meta = TRANSACTION_STATUS_META[props.status as TransactionStatus]
      break
    case 'user':
      meta = USER_STATUS_META[props.status as UserStatus]
      break
  }

  return meta ?? { label: props.status, tone: 'gray' }
}

export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone } = resolve(props)
  return (
    <Badge tone={tone} className={props.className}>
      {label}
    </Badge>
  )
}
