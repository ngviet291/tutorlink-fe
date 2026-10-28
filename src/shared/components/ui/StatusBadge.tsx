import {
  ACCOUNT_STATUS_META,
  APPLICATION_STATUS_META,
  POST_STATUS_META,
  PROFILE_STATUS_META,
  TRANSACTION_STATUS_META,
  type BadgeTone,
} from '@/constants/enums'
import type {
  AccountStatus,
  ApplicationStatus,
  PostStatus,
  ProfileStatus,
  TransactionStatus,
} from '@/shared/types/common.types'
import { Badge } from './Badge'

type StatusBadgeProps =
  | { kind: 'post'; status: PostStatus; className?: string }
  | { kind: 'application'; status: ApplicationStatus; className?: string }
  | { kind: 'profile'; status: ProfileStatus; className?: string }
  | { kind: 'transaction'; status: TransactionStatus; className?: string }
  | { kind: 'account'; status: AccountStatus; className?: string }

function resolve(props: StatusBadgeProps): { label: string; tone: BadgeTone } {
  switch (props.kind) {
    case 'post':
      return POST_STATUS_META[props.status]
    case 'application':
      return APPLICATION_STATUS_META[props.status]
    case 'profile':
      return PROFILE_STATUS_META[props.status]
    case 'transaction':
      return TRANSACTION_STATUS_META[props.status]
    case 'account':
      return ACCOUNT_STATUS_META[props.status]
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
