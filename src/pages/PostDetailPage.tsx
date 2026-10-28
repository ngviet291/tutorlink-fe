import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Clock, Info, MapPin, Pencil, Trash2, Wallet, Wifi, XCircle } from 'lucide-react'
import { EDUCATION_LEVEL_LABEL, POST_TYPE_LABEL, TEACHING_MODE_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { MaskedContact } from '@/shared/components/ui/MaskedContact'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { Tooltip } from '@/shared/components/ui/Tooltip'
import { formatBudgetRange } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useToast } from '@/shared/hooks/useToast'
import { ApplicantList } from '@/features/application/components/ApplicantList'
import { ApplyModal } from '@/features/application/components/ApplyModal'
import { useMyApplications } from '@/features/application/hooks/useApplications'
import { useApplicationMutations } from '@/features/application/hooks/useApplications'
import { usePost, usePostMutations } from '@/features/post/hooks/usePosts'
import { useMyTutorProfile } from '@/features/tutor/hooks/useTutors'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const { data: post, isLoading, isError, refetch } = usePost(id)
  const { remove, publish } = usePostMutations()
  const { cancel } = useApplicationMutations()
  const [applyOpen, setApplyOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isTutor = user?.role === 'TUTOR'
  const myApps = useMyApplications(Boolean(user))
  const myTutor = useMyTutorProfile(isTutor)

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message="Không tìm thấy bài đăng hoặc bài đã bị gỡ." onRetry={() => void refetch()} />
      </div>
    )
  }

  const isAuthor = user?.id === post.author.id
  const myApplication = myApps.data?.find((a) => a.post.id === post.id && a.applicant.id === user?.id)
  const alreadyApplied = Boolean(myApplication && myApplication.status !== 'CANCELLED')

  // Người đủ điều kiện đăng ký: gia sư APPROVED → bài FIND_TUTOR; học viên → bài FIND_STUDENT
  const roleMatches = post.type === 'FIND_TUTOR' ? user?.role === 'TUTOR' : user?.role === 'STUDENT'
  const tutorApproved = post.type === 'FIND_TUTOR' ? myTutor.data?.profileStatus === 'APPROVED' : true

  let disabledReason: string | undefined
  if (isAuthor) disabledReason = 'Bạn không thể đăng ký bài của chính mình'
  else if (alreadyApplied) disabledReason = 'Bạn đã đăng ký bài này rồi'
  else if (post.status !== 'PUBLISHED') disabledReason = 'Bài đăng không còn nhận đăng ký'
  else if (isTutor && post.type === 'FIND_TUTOR' && !tutorApproved) disabledReason = 'Hồ sơ gia sư của bạn chưa được duyệt'

  const onApply = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.POST_DETAIL(post.id) } })
      return
    }
    setApplyOpen(true)
  }

  const onDelete = () =>
    remove.mutate(post.id, {
      onSuccess: () => {
        toast.success('Đã xóa bài đăng')
        navigate(ROUTES.MY_POSTS)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  const canEdit = isAuthor && post.status !== 'CLOSED' && post.status !== 'REMOVED'

  const info: { icon: typeof MapPin; label: string; value: string }[] = [
    { icon: MapPin, label: 'Khu vực', value: [post.address.detail, post.address.district, post.address.city].filter(Boolean).join(', ') },
    { icon: Wifi, label: 'Hình thức', value: TEACHING_MODE_LABEL[post.teachingMode] },
    { icon: Clock, label: 'Lịch học', value: `${post.sessionsPerWeek} buổi/tuần · ${post.durationMinutes} phút/buổi` },
    { icon: CalendarDays, label: 'Hạn đăng ký', value: formatDate(post.deadline) },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={post.type === 'FIND_TUTOR' ? 'orange' : 'blue'}>{POST_TYPE_LABEL[post.type]}</Badge>
          <SubjectTag name={post.subject.name} />
          <Badge tone="gray">{EDUCATION_LEVEL_LABEL[post.educationLevel]}</Badge>
          <StatusBadge kind="post" status={post.status} />
        </div>
        <h1 className="text-2xl font-extrabold leading-snug text-text sm:text-3xl">{post.title}</h1>
        <p className="mt-3 text-2xl font-extrabold text-primary">
          {formatBudgetRange(post.minBudget, post.maxBudget)} <span className="text-sm font-medium text-text-secondary">/tháng (dự kiến)</span>
        </p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-surface-hover p-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-xs text-text-secondary">{label}</dt>
                <dd className="text-sm font-semibold text-text">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <h2 className="mb-2 mt-6 text-lg font-bold text-text">Mô tả chi tiết</h2>
        <p className="whitespace-pre-line text-text-secondary">{post.content}</p>

        <p className="mt-5 flex items-start gap-2 rounded-xl border border-border p-3 text-xs text-text-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          Học phí thực tế hằng tháng do hai bên tự thỏa thuận ngoài hệ thống TutorLink. Gia sư chỉ trả một khoản phí nhận lớp (tính trên học phí dự kiến tháng đầu) khi được chọn.
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={post.author.fullName} src={post.author.avatarUrl} size="lg" />
            <div>
              <p className="text-xs text-text-secondary">Người đăng</p>
              <p className="font-bold text-text">{post.author.fullName}</p>
              <p className="text-xs text-text-secondary">{post.applicationCount ?? 0} lượt đăng ký</p>
            </div>
          </div>
          <MaskedContact className="sm:w-72" contact={post.author.contact} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!isAuthor && (
            <Tooltip text={disabledReason}>
              <Button
                size="lg"
                onClick={onApply}
                disabled={Boolean(disabledReason) || (Boolean(user) && !roleMatches)}
              >
                Đăng ký nhận lớp
              </Button>
            </Tooltip>
          )}
          {!isAuthor && user && !roleMatches && !disabledReason && (
            <p className="self-center text-xs text-text-secondary">
              {post.type === 'FIND_TUTOR' ? 'Chỉ gia sư mới đăng ký bài này.' : 'Chỉ học viên mới đăng ký bài này.'}
            </p>
          )}
          {!user && (
            <p className="self-center text-xs text-text-secondary">
              <Link className="font-semibold text-primary" to={ROUTES.LOGIN}>Đăng nhập</Link> để đăng ký nhận lớp.
            </p>
          )}
          {alreadyApplied && myApplication?.status === 'PENDING' && (
            <Button
              variant="ghost"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(myApplication.id, { onSuccess: () => toast.success('Đã hủy đăng ký'), onError: (e) => toast.error(getErrorMessage(e)) })}
            >
              <XCircle className="size-4" /> Hủy đăng ký
            </Button>
          )}
          {isTutor && post.type === 'FIND_TUTOR' && myTutor.data && myTutor.data.profileStatus !== 'APPROVED' && (
            <Link to={ROUTES.TUTOR_PROFILE} className="self-center text-xs font-semibold text-primary hover:underline">
              <Wallet className="mr-1 inline size-3.5" /> Xem trạng thái hồ sơ gia sư
            </Link>
          )}
        </div>

        {canEdit && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            {post.status === 'DRAFT' && (
              <Button
                loading={publish.isPending}
                onClick={() => publish.mutate(post.id, { onSuccess: () => toast.success('Đã đăng công khai'), onError: (e) => toast.error(getErrorMessage(e)) })}
              >
                Đăng công khai
              </Button>
            )}
            <Link to={ROUTES.POST_EDIT(post.id)}><Button variant="outline"><Pencil className="size-4" /> Sửa bài</Button></Link>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" /> Xóa bài</Button>
          </div>
        )}
      </article>

      {isAuthor && post.status !== 'DRAFT' && (
        <div className="mt-6"><ApplicantList post={post} /></div>
      )}

      <ApplyModal postId={post.id} open={applyOpen} onClose={() => setApplyOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xóa bài đăng?"
        danger
        confirmText="Xóa bài"
        loading={remove.isPending}
        onConfirm={onDelete}
        description="Bài đăng sẽ bị xóa vĩnh viễn. Thao tác này chỉ thực hiện được khi bài chưa ghép cặp."
      />
    </div>
  )
}
