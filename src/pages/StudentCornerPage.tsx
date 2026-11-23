import { Link } from 'react-router-dom'
import { CheckCircle2, FilePlus2, GraduationCap, Heart, MessageCircle, Search, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { useAppSelector } from '@/shared/hooks/useAppStore'

interface Shortcut { to: string; icon: LucideIcon; title: string; desc: string }

const SHORTCUTS: Shortcut[] = [
  { to: ROUTES.POST_CREATE, icon: FilePlus2, title: 'Đăng bài tìm gia sư', desc: 'Mô tả môn học, khu vực, học phí, số buổi/tuần.' },
  { to: ROUTES.MY_POSTS, icon: FileText, title: 'Bài đăng của tôi', desc: 'Xem đăng ký từ gia sư và chọn người phù hợp.' },
  { to: ROUTES.FIND_TUTOR, icon: Search, title: 'Tìm gia sư', desc: 'Duyệt hồ sơ gia sư đã được duyệt.' },
  { to: ROUTES.FAVORITES, icon: Heart, title: 'Gia sư yêu thích', desc: 'Danh sách gia sư bạn đã lưu.' },
  { to: ROUTES.CHAT_INBOX, icon: MessageCircle, title: 'Tin nhắn', desc: 'Trao đổi với gia sư sau khi chốt lớp.' },
]

const STEPS = [
  'Đăng bài tìm gia sư: môn học, cấp học, khu vực, hình thức, học phí dự kiến, số buổi/tuần, hạn nhận đăng ký.',
  'Nhận đăng ký từ các gia sư đã được duyệt. Xem “AI gợi ý Top 5” (chỉ để tham khảo) và danh sách đầy đủ.',
  'Tự chọn ứng viên phù hợp. Khi gia sư thanh toán phí nhận lớp, thông tin liên hệ và chat sẽ mở.',
  'Học phí hằng tháng bạn tự thỏa thuận với gia sư — bạn không phải trả phí nền tảng.',
  'Khi lớp kết thúc, hãy đánh giá gia sư để giúp cộng đồng.',
]

export default function StudentCornerPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isStudent = user?.role === 'STUDENT'
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl bg-primary-light p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="size-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-text">Góc Học Viên</h1>
        </div>
        <p className="mt-2 text-text-secondary">
          {isStudent
            ? 'Quản lý việc tìm gia sư của bạn ở một nơi.'
            : 'Dành cho học viên: tìm được gia sư phù hợp chỉ trong vài bước, hoàn toàn miễn phí.'}
        </p>
        {!isStudent && (
          <div className="mt-4">
            <Link to={ROUTES.REGISTER_STUDENT}><Button>Đăng ký làm học viên</Button></Link>
          </div>
        )}
      </div>

      {isStudent && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-text">Lối tắt của học viên</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to} className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-primary">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-text">{title}</span>
                  <span className="block text-sm text-text-secondary">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-text">Cách tìm gia sư</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-text">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
