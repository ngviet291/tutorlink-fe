import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'

const STEPS = [
  'Đăng ký tài khoản học viên — hoàn toàn miễn phí.',
  'Đăng bài tìm gia sư: môn học, cấp học, khu vực, hình thức, học phí dự kiến, số buổi/tuần và hạn nhận đăng ký.',
  'Nhận đăng ký từ các gia sư đã được duyệt. Xem panel “AI gợi ý Top 5” (chỉ mang tính tham khảo) và danh sách đầy đủ.',
  'Tự chọn bất kỳ ứng viên nào. Khi gia sư thanh toán phí nhận lớp, thông tin liên hệ và chat sẽ mở.',
  'Khi lớp kết thúc, hãy đánh giá gia sư để giúp cộng đồng.',
]

export default function StudentCornerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-text">Góc Học Sinh</h1>
      <p className="mt-2 text-text-secondary">Tìm được gia sư phù hợp chỉ trong vài bước.</p>
      <ol className="mt-6 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="text-text">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.POST_CREATE}><Button>Đăng bài tìm gia sư</Button></Link>
        <Link to={ROUTES.FIND_TUTOR}><Button variant="outline">Xem danh sách gia sư</Button></Link>
      </div>
    </div>
  )
}
