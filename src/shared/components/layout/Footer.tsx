import { Link } from 'react-router-dom'
import { Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/shared/components/ui/Logo'

export function Footer() {
  const col = 'flex flex-col gap-2 text-sm text-text-secondary'
  const link = 'hover:text-primary'
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-sm text-text-secondary">
            Nền tảng ghép cặp gia sư và học viên minh bạch, nhanh chóng trên toàn quốc.
          </p>
          <div className="flex gap-3 text-text-secondary">
            <a href="#" aria-label="Website" className={link}>
              <Globe className="size-5" />
            </a>
            <a href="#" aria-label="Cộng đồng" className={link}>
              <MessageCircle className="size-5" />
            </a>
          </div>
        </div>

        <nav aria-label="Khám phá" className={col}>
          <h3 className="mb-1 font-bold text-text">Khám phá</h3>
          <Link className={link} to={ROUTES.FIND_TUTOR}>Tìm gia sư</Link>
          <Link className={link} to={ROUTES.FIND_CLASS}>Tìm lớp dạy</Link>
          <Link className={link} to={ROUTES.TUTOR_CORNER}>Góc gia sư</Link>
          <Link className={link} to={ROUTES.STUDENT_CORNER}>Góc học sinh</Link>
        </nav>

        <nav aria-label="Hỗ trợ" className={col}>
          <h3 className="mb-1 font-bold text-text">Hỗ trợ</h3>
          <span>Hướng dẫn sử dụng</span>
          <span>Quy định phí nhận lớp</span>
          <span>Chính sách bảo mật</span>
          <span>Điều khoản dịch vụ</span>
        </nav>

        <div className={col}>
          <h3 className="mb-1 font-bold text-text">Liên hệ</h3>
          <span className="flex items-center gap-2"><Phone className="size-4" /> 1900 0000</span>
          <span className="flex items-center gap-2"><Mail className="size-4" /> support@tutorlink.vn</span>
          <span className="flex items-center gap-2"><MapPin className="size-4" /> TP. Hồ Chí Minh, Việt Nam</span>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} TutorLink. Học phí hằng tháng do hai bên tự thỏa thuận ngoài hệ thống.
      </div>
    </footer>
  )
}
