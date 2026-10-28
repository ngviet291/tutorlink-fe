import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, Brain, Calculator, ChevronLeft, ChevronRight, Code2, FlaskConical, Languages, Music2, Quote,
  Atom, Dna, ShieldCheck, Sparkles, Wallet, Eye, type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { PostCard } from '@/features/post/components/PostCard'
import { TutorCard } from '@/features/tutor/components/TutorCard'
import { usePosts } from '@/features/post/hooks/usePosts'
import { useTutors } from '@/features/tutor/hooks/useTutors'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import { useAppSelector } from '@/shared/hooks/useAppStore'

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'sub-math': Calculator, 'sub-lit': BookOpen, 'sub-eng': Languages, 'sub-phy': Atom,
  'sub-chem': FlaskConical, 'sub-bio': Dna, 'sub-it': Code2, 'sub-art': Music2,
}

const TESTIMONIALS = [
  { name: 'Chị Lan — phụ huynh lớp 9', text: 'Đăng bài buổi sáng, chiều đã có 5 gia sư đăng ký. Gợi ý AI giúp mình chọn được cô phù hợp rất nhanh.' },
  { name: 'Anh Quốc Bảo — gia sư Tin học', text: 'Chỉ trả phí khi được nhận lớp nên rất công bằng. Hồ sơ được kiểm duyệt nên học viên tin tưởng hơn.' },
  { name: 'Em Hoàng Nam — học sinh lớp 11', text: 'Mình tìm được gia sư Tiếng Anh dạy online đúng khung giờ rảnh. Thông tin rõ ràng, không lo bị lừa.' },
]

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="size-4" /> Ghép cặp thông minh có AI gợi ý
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl">
            Kết nối <span className="text-primary">Gia Sư — Học Sinh</span> toàn quốc
          </h1>
          <p className="max-w-xl text-lg text-text-secondary">
            Đăng yêu cầu, nhận hồ sơ phù hợp, tự tay chọn người đồng hành. Chỉ trả phí khi lớp học thực sự được kết nối.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.FIND_TUTOR}>
              <Button size="lg">Tìm Gia Sư Ngay <ArrowRight className="size-5" /></Button>
            </Link>
            <Link to={ROUTES.POST_CREATE}>
              <Button size="lg" variant="outline">Đăng Lớp Học</Button>
            </Link>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 pt-2">
            {[['2.500+', 'Gia sư đã duyệt'], ['8.000+', 'Lớp đã kết nối'], ['4.8/5', 'Đánh giá trung bình']].map(([n, l]) => (
              <div key={l}>
                <dt className="text-2xl font-extrabold text-primary">{n}</dt>
                <dd className="text-xs text-text-secondary">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          <div className="absolute -left-6 -top-6 size-40 rounded-full bg-secondary/40 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 size-48 rounded-full bg-primary/30 blur-2xl" />
          <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">H</span>
              <div>
                <p className="font-bold text-text">Trần Thị Hương</p>
                <p className="text-xs text-text-secondary">Toán · Lý · 5 năm kinh nghiệm</p>
              </div>
              <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Phù hợp 94%</span>
            </div>
            <div className="mb-4 space-y-2">
              {[['Môn học', 100], ['Khu vực', 85], ['Lịch dạy', 90], ['Đánh giá', 96]].map(([l, v]) => (
                <div key={l}>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary"><span>{l}</span><span>{v}%</span></div>
                  <div className="h-2 rounded-full bg-border"><div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 rounded-xl bg-primary-light p-3 text-xs text-text-secondary">
              <Brain className="size-4 shrink-0 text-primary" /> Chỉ mang tính tham khảo — bạn luôn là người quyết định.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionHead({ title, to, sub }: { title: string; to?: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-text">{title}</h2>
        {sub && <p className="mt-1 text-sm text-text-secondary">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Xem tất cả <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}

function Testimonials() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(t)
  }, [])
  const cur = TESTIMONIALS[i]!
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
      <Quote className="mx-auto mb-4 size-8 text-secondary" />
      <p className="min-h-20 text-lg text-text" key={i}>{cur.text}</p>
      <p className="mt-4 text-sm font-semibold text-primary">{cur.name}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" aria-label="Trước" onClick={() => setI((i + TESTIMONIALS.length - 1) % TESTIMONIALS.length)} className="cursor-pointer rounded-full border border-border p-2 hover:bg-surface-hover"><ChevronLeft className="size-4" /></button>
        {TESTIMONIALS.map((_, k) => (
          <span key={k} className={`size-2 rounded-full ${k === i ? 'bg-primary' : 'bg-border'}`} />
        ))}
        <button type="button" aria-label="Sau" onClick={() => setI((i + 1) % TESTIMONIALS.length)} className="cursor-pointer rounded-full border border-border p-2 hover:bg-surface-hover"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const user = useAppSelector((s) => s.auth.user)
  const subjects = useSubjects()
  const tutors = useTutors({ pageSize: 4 })
  const posts = usePosts({ type: 'FIND_TUTOR', pageSize: 6 })

  return (
    <>
      <Hero />

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-14">
        <section>
          <SectionHead title="Danh mục môn học" sub="Chọn môn để xem gia sư và lớp học phù hợp" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(subjects.data ?? []).slice(0, 8).map((s) => {
              const Icon = SUBJECT_ICONS[s.id] ?? BookOpen
              return (
                <Link
                  key={s.id}
                  to={`${ROUTES.FIND_TUTOR}?subject=${s.id}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary-light text-primary"><Icon className="size-6" /></span>
                  <span className="text-sm font-bold text-text">{s.name}</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHead title="Gia Sư Được Đánh Giá Cao" to={ROUTES.FIND_TUTOR} />
          {tutors.isLoading ? <CardGridSkeleton count={4} /> : tutors.isError ? <ErrorState onRetry={() => void tutors.refetch()} /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tutors.data?.items.map((t) => <TutorCard key={t.id} tutor={t} />)}
            </div>
          )}
        </section>

        <section>
          <SectionHead title="Lớp Học Đang Tuyển Gia Sư" to={ROUTES.FIND_CLASS} />
          {posts.isLoading ? <CardGridSkeleton count={6} /> : posts.isError ? <ErrorState onRetry={() => void posts.refetch()} /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.data?.items.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link to={ROUTES.FIND_CLASS}><Button variant="outline">Xem tất cả lớp học</Button></Link>
          </div>
        </section>

        <section>
          <SectionHead title="Quy trình 3 bước đơn giản" />
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Đăng yêu cầu', 'Mô tả môn học, khu vực, ngân sách và lịch học mong muốn.'],
              ['2', 'Chọn gia sư', 'Xem danh sách ứng viên cùng gợi ý AI Top 5, tự chọn người phù hợp nhất.'],
              ['3', 'Bắt đầu học', 'Sau khi gia sư thanh toán phí nhận lớp, liên hệ và chat được mở khóa.'],
            ].map(([n, t, d]) => (
              <li key={n} className="relative rounded-2xl border border-border bg-surface p-6">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">{n}</span>
                <h3 className="mb-1 text-lg font-bold text-text">{t}</h3>
                <p className="text-sm text-text-secondary">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionHead title="Vì sao chọn TutorLink?" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Eye, t: 'Minh bạch', d: 'Quy trình, mức phí và trạng thái đều hiển thị rõ ràng.' },
              { icon: Wallet, t: 'Chỉ trả phí khi được nhận lớp', d: 'Gia sư chỉ thanh toán khi được chọn, học viên không mất phí.' },
              { icon: Brain, t: 'AI gợi ý', d: 'Top 5 ứng viên theo môn, khu vực, lịch dạy, kinh nghiệm, đánh giá.' },
              { icon: ShieldCheck, t: 'Hồ sơ được kiểm duyệt', d: 'Mọi hồ sơ gia sư đều được Admin xét duyệt trước khi công khai.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-surface p-5">
                <Icon className="mb-3 size-7 text-primary" />
                <h3 className="mb-1 font-bold text-text">{t}</h3>
                <p className="text-sm text-text-secondary">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHead title="Học viên và gia sư nói gì" />
          <Testimonials />
        </section>

        <section className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Bạn là gia sư? Đăng ký nhận lớp ngay hôm nay</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Tạo hồ sơ giảng dạy, được duyệt và bắt đầu nhận lớp từ hàng nghìn yêu cầu mới mỗi tuần.</p>
          <Link to={user?.role === 'TUTOR' ? ROUTES.TUTOR_PROFILE : ROUTES.REGISTER} className="mt-6 inline-block">
            <Button size="lg" variant="secondary">Tạo hồ sơ gia sư</Button>
          </Link>
        </section>
      </div>
    </>
  )
}
