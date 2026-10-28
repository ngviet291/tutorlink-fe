import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { useAppSelector } from '@/shared/hooks/useAppStore'

const STEPS = [
  'Đăng ký tài khoản gia sư và hoàn thiện hồ sơ giảng dạy (môn dạy, kinh nghiệm, học vấn, chứng chỉ, giá/giờ).',
  'Chờ Admin duyệt hồ sơ. Hồ sơ APPROVED mới hiển thị công khai và được đăng ký nhận lớp.',
  'Duyệt các lớp đang tuyển gia sư, gửi đăng ký kèm lời nhắn — hoặc tự đăng bài tìm học viên.',
  'Khi được chọn, thanh toán phí nhận lớp bằng ví (nạp tiền qua chuyển khoản) trong thời hạn quy định.',
  'Thanh toán thành công: thông tin liên hệ và kênh chat được mở. Học phí hằng tháng hai bên tự thỏa thuận.',
]

export default function TutorCornerPage() {
  const user = useAppSelector((s) => s.auth.user)
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-text">Góc Gia Sư</h1>
      <p className="mt-2 text-text-secondary">Hướng dẫn nhanh để bắt đầu nhận lớp trên TutorLink.</p>
      <ol className="mt-6 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="text-text">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-2xl bg-primary-light p-5">
        <h2 className="font-bold text-text">Phí nhận lớp</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Bằng một tỉ lệ phần trăm (hiện 20%, do Admin cấu hình) của học phí dự kiến tháng đầu. Ví chỉ dùng để nạp và trả phí, không có chức năng rút tiền.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.FIND_CLASS}><Button>Xem lớp đang tuyển</Button></Link>
        <Link to={user?.role === 'TUTOR' ? ROUTES.TUTOR_PROFILE : ROUTES.REGISTER}><Button variant="outline">Tạo hồ sơ gia sư</Button></Link>
      </div>
    </div>
  )
}
