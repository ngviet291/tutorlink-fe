import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, BadgeCheck, Briefcase, GraduationCap, Heart, MapPin, MessageCircle } from 'lucide-react'
import { DAY_LABEL, EDUCATION_LEVEL_LABEL, TEACHING_MODE_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { MaskedContact } from '@/shared/components/ui/MaskedContact'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { Tabs } from '@/shared/components/ui/Tabs'
import { formatVnd } from '@/shared/utils/currency'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useToast } from '@/shared/hooks/useToast'
import { ReviewList } from '@/features/review/components/ReviewList'
import { useTutor } from '@/features/tutor/hooks/useTutors'
import { useFavorites, useToggleFavorite } from '@/features/favorite/hooks/useFavorites'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'

type Tab = 'about' | 'certs' | 'reviews' | 'schedule'

export default function TutorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const { data: tutor, isLoading, isError, refetch } = useTutor(id)
  const [tab, setTab] = useState<Tab>('about')
  const canFavorite = user?.role === 'STUDENT'
  const favorites = useFavorites(canFavorite)
  const toggle = useToggleFavorite()
  const isFav = Boolean(favorites.data?.some((t) => t.id === id))

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !tutor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message="Không tìm thấy hồ sơ gia sư hoặc hồ sơ chưa được duyệt." onRetry={() => void refetch()} />
      </div>
    )
  }

  const onContact = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.TUTOR_DETAIL(tutor.id) } })
      return
    }
    toast.info('Hãy đăng bài tìm gia sư hoặc đăng ký lớp để được kết nối. Thông tin liên hệ mở sau khi thanh toán phí nhận lớp.')
  }

  const onFavorite = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.TUTOR_DETAIL(tutor.id) } })
      return
    }
    if (!canFavorite) {
      toast.info('Chỉ tài khoản học viên mới lưu gia sư yêu thích.')
      return
    }
    toggle.mutate(tutor.id, { onSuccess: (r) => toast.success(r.favorited ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích') })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-10">
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-text sm:text-3xl">
            {tutor.fullName}
            {tutor.profileStatus === 'APPROVED' ? (
              <Badge tone="blue" icon={<BadgeCheck className="size-3.5" />}>Đã xác minh</Badge>
            ) : (
              <StatusBadge kind="profile" status={tutor.profileStatus} />
            )}
          </h1>
          <div className="mt-2"><RatingStars value={tutor.averageRating} size="md" count={tutor.reviewCount} /></div>
          <div className="mt-3 flex flex-wrap gap-1.5">{tutor.subjects.map((s) => <SubjectTag key={s.id} name={s.name} />)}</div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
            <li className="flex items-center gap-1.5"><Briefcase className="size-4" /> {tutor.experienceYears} năm kinh nghiệm</li>
            <li className="flex items-center gap-1.5"><MapPin className="size-4" /> {[tutor.district, tutor.city].filter(Boolean).join(', ')}</li>
            {tutor.teachingMode && <li>{TEACHING_MODE_LABEL[tutor.teachingMode]}</li>}
          </ul>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-extrabold text-primary">{formatVnd(tutor.hourlyRate)}</p>
          <p className="text-xs text-text-secondary">mỗi giờ</p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'about', label: 'Giới thiệu' },
              { value: 'certs', label: 'Bằng cấp / Chứng chỉ' },
              { value: 'reviews', label: `Đánh giá${tutor.reviewCount ? ` (${tutor.reviewCount})` : ''}` },
              { value: 'schedule', label: 'Lịch dạy' },
            ]}
          />
          <div className="mt-4">
            {tab === 'about' && (
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
                <p className="whitespace-pre-line text-text">{tutor.bio || 'Gia sư chưa có phần giới thiệu.'}</p>
                {tutor.education && (
                  <p className="flex items-start gap-2 text-sm text-text-secondary"><GraduationCap className="mt-0.5 size-4 shrink-0" /> {tutor.education}</p>
                )}
                {tutor.educationLevels && (
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.educationLevels.map((l) => <Badge key={l} tone="gray">{EDUCATION_LEVEL_LABEL[l]}</Badge>)}
                  </div>
                )}
              </div>
            )}
            {tab === 'certs' && (
              tutor.certificates.length ? (
                <ul className="flex flex-col gap-3">
                  {tutor.certificates.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-light text-primary"><Award className="size-5" /></span>
                      <div>
                        <p className="font-semibold text-text">{c.name}</p>
                        <p className="text-xs text-text-secondary">{c.issuer} · {c.year}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="Chưa có chứng chỉ" />
            )}
            {tab === 'reviews' && <ReviewList tutorId={tutor.id} />}
            {tab === 'schedule' && (
              tutor.schedule?.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tutor.schedule.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                      <span className="font-semibold text-text">{DAY_LABEL[s.day]}</span>
                      <span className="text-sm text-text-secondary">{s.from} – {s.to}</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="Chưa cập nhật lịch dạy" />
            )}
          </div>
        </div>

        <aside className="hidden flex-col gap-3 lg:flex">
          <div className="sticky top-20 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
            <MaskedContact />
            <Button fullWidth onClick={onContact}><MessageCircle className="size-4" /> Liên hệ gia sư</Button>
            <Button fullWidth variant={isFav ? 'secondary' : 'outline'} onClick={onFavorite} loading={toggle.isPending}>
              <Heart className={isFav ? 'size-4 fill-current' : 'size-4'} /> {isFav ? 'Đã yêu thích' : 'Lưu vào yêu thích'}
            </Button>
            {!user && <p className="text-xs text-text-secondary"><Link className="font-semibold text-primary" to={ROUTES.LOGIN}>Đăng nhập</Link> để liên hệ và lưu gia sư.</p>}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-surface p-3 lg:hidden">
        <Button className="flex-1" onClick={onContact}><MessageCircle className="size-4" /> Liên hệ</Button>
        <Button variant={isFav ? 'secondary' : 'outline'} onClick={onFavorite} aria-label="Yêu thích"><Heart className={isFav ? 'size-4 fill-current' : 'size-4'} /></Button>
      </div>
    </div>
  )
}
