import { Link } from "react-router-dom";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Logo } from "@/shared/components/ui/Logo";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import type { Role } from "@/shared/types/common.types";

interface FooterLink {
  to: string;
  label: string;
  /** Vai trò không thấy link này (khách chưa đăng nhập được coi là học viên). */
  hideFor?: Role[];
}

const EXPLORE_LINKS: FooterLink[] = [
  { to: ROUTES.FIND_TUTOR, label: "Tìm gia sư", hideFor: ["TUTOR"] },
  { to: ROUTES.FIND_CLASS, label: "Tìm lớp dạy" },
  { to: ROUTES.TUTOR_CORNER, label: "Góc gia sư", hideFor: ["STUDENT"] },
  { to: ROUTES.STUDENT_CORNER, label: "Góc học sinh", hideFor: ["TUTOR"] },
];

export function Footer() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const effective: Role = role ?? "STUDENT";
  const exploreLinks =
    role === "ADMIN"
      ? []
      : EXPLORE_LINKS.filter((l) => !l.hideFor?.includes(effective));

  const col = "flex flex-col gap-2 text-sm text-text-secondary";
  const link = "hover:text-primary";
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-sm text-text-secondary">
            Nền tảng ghép cặp gia sư và học viên minh bạch, nhanh chóng trên
            toàn quốc.
          </p>
          <div className="flex gap-3 text-text-secondary">
            <a href="#" aria-label="Website" className={link}>
              <Globe className="size-5" />
            </a>
            <Link to={ROUTES.CHAT_INBOX} aria-label="Tin nhắn" className={link}>
              <MessageCircle className="size-5" />
            </Link>
          </div>
        </div>

        {exploreLinks.length > 0 && (
          <nav aria-label="Khám phá" className={col}>
            <h3 className="mb-1 font-bold text-text">Khám phá</h3>
            {exploreLinks.map((l) => (
              <Link key={l.to} className={link} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label="Hỗ trợ" className={col}>
          <h3 className="mb-1 font-bold text-text">Hỗ trợ</h3>
          <Link className={link} to={ROUTES.GUIDE}>
            Hướng dẫn sử dụng
          </Link>
          <Link className={link} to={ROUTES.FEE_POLICY}>
            Quy định phí nhận lớp
          </Link>
          <Link className={link} to={ROUTES.PRIVACY}>
            Chính sách bảo mật
          </Link>
          <Link className={link} to={ROUTES.TERMS}>
            Điều khoản dịch vụ
          </Link>
        </nav>

        <div className={col}>
          <h3 className="mb-1 font-bold text-text">Liên hệ</h3>
          <span className="flex items-center gap-2">
            <Phone className="size-4" /> 1900 0000
          </span>
          <span className="flex items-center gap-2">
            <Mail className="size-4" /> tutorlink.n3@gmail.com
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4" /> 12 Nguyễn Văn Bảo, Phường Hạnh
            Thông,TP.HCM
          </span>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} TutorLink. Học phí hằng tháng do hai bên tự
        thỏa thuận ngoài hệ thống.
      </div>
    </footer>
  );
}
