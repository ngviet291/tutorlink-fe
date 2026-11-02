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
  | { kind: 'post'; status: PostStatus; className?: string }
  | { kind: 'application'; status: ApplicationStatus; className?: string }
  | { kind: 'verification'; status: VerificationStatus; className?: string }
  | { kind: 'transaction'; status: TransactionStatus; className?: string }
  | { kind: 'user'; status: UserStatus; className?: string }

function resolve(props: StatusBadgeProps): { label: string; tone: BadgeTone } {
  switch (props.kind) {
    case 'post':
      return POST_STATUS_META[props.status]
    case 'application':
      return APPLICATION_STATUS_META[props.status]
    case 'verification':
      return VERIFICATION_STATUS_META[props.status]
    case 'transaction':
      return TRANSACTION_STATUS_META[props.status]
    case 'user':
      return USER_STATUS_META[props.status]
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone } = resolve(props)
  return (
    <Badge tone={tone} className={props.className}>
      {label}
    </Badge>
  )
}
