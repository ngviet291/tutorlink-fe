import { Link } from 'react-router-dom'
import {
  BookOpenCheck, CheckCircle2, ClipboardList, MessageCircle, Search, UserRound, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { useAppSelector } from '@/shared/hooks/useAppStore'

interface Shortcut { to: string; icon: LucideIcon; title: string; desc: string }

const SHORTCUTS: Shortcut[] = [
  { to: ROUTES.FIND_CLASS, icon: Search, title: 'Tìm lớp đang tuyển', desc: 'Duyệt bài đăng của học viên theo môn, khu vực, học phí.' },
  { to: ROUTES.MY_APPLICATIONS, icon: ClipboardList, title: 'Đơn đăng ký của tôi', desc: 'Theo dõi lớp đã ứng tuyển và lớp được chọn.' },
  { to: ROUTES.TUTOR_PROFILE, icon: UserRound, title: 'Hồ sơ gia sư', desc: 'Cập nhật môn dạy, kinh nghiệm, chứng chỉ, giá/giờ.' },
  { to: ROUTES.WALLET, icon: Wallet, title: 'Ví & phí nhận lớp', desc: 'Nạp tiền và thanh toán phí nhận lớp.' },
  { to: ROUTES.CHAT_INBOX, icon: MessageCircle, title: 'Tin nhắn', desc: 'Trao đổi với học viên sau khi nhận lớp.' },
]

const STEPS = [
  'Hoàn thiện hồ sơ giảng dạy: môn dạy, kinh nghiệm, học vấn, chứng chỉ, giá/giờ.',
  'Chờ Admin duyệt hồ sơ. Hồ sơ được duyệt mới hiển thị công khai và được ứng tuyển.',
  'Ứng tuyển vào các lớp phù hợp kèm lời nhắn giới thiệu bản thân.',
  'Khi được học viên chọn, thanh toán phí nhận lớp bằng ví trong thời hạn quy định.',
  'Thanh toán xong: thông tin liên hệ và kênh chat được mở. Học phí hằng tháng hai bên tự thỏa thuận.',
]

export default function TutorCornerPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isTutor = user?.role === 'TUTOR'
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl bg-primary-light p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="size-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-text">Góc Gia Sư</h1>
        </div>
        <p className="mt-2 text-text-secondary">
          {isTutor
            ? 'Mọi thứ bạn cần để nhận lớp và quản lý việc dạy của mình.'
            : 'Dành cho gia sư: tìm lớp, ứng tuyển và nhận lớp trên TutorLink.'}
        </p>
        {!isTutor && (
          <div className="mt-4">
            <Link to={ROUTES.REGISTER_TUTOR}><Button>Đăng ký làm gia sư</Button></Link>
          </div>
        )}
      </div>

      {isTutor && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-text">Lối tắt của gia sư</h2>
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
        <h2 className="text-lg font-bold text-text">Quy trình nhận lớp</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-text">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-bold text-text">Phí nhận lớp</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Phí do gia sư thanh toán, bằng một tỉ lệ phần trăm (hiện 20%, do Admin cấu hình) của học phí dự kiến tháng đầu. Ví chỉ dùng để nạp và trả phí.
        </p>
        <Link to={ROUTES.FEE_POLICY} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Xem chính sách phí</Link>
      </section>
    </div>
  )
}
