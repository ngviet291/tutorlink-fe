import { useState } from "react";
import {
  BadgeCheck,
  FilePlus2,
  GraduationCap,
  Handshake,
  Send,
  Star,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

type Role = "student" | "tutor";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TABS: { role: Role; label: string }[] = [
  { role: "student", label: "Học viên" },
  { role: "tutor", label: "Gia sư" },
];

// Luồng: học viên đăng bài tìm gia sư (FIND_TUTOR)
const STEPS: Record<Role, Step[]> = {
  student: [
    {
      icon: FilePlus2,
      title: "Đăng bài",
      description: "Nêu môn học, yêu cầu và ngân sách bạn mong muốn.",
    },
    {
      icon: Users,
      title: "Nhận ứng tuyển",
      description: "Xem các gia sư đăng ký dạy và mức phí họ đề xuất.",
    },
    {
      icon: UserCheck,
      title: "Chọn gia sư",
      description:
        "Chọn người phù hợp, rồi chờ gia sư thanh toán phí và xác nhận.",
    },
    {
      icon: Star,
      title: "Học và đánh giá",
      description: "Hoàn thành lớp học và đánh giá gia sư của bạn.",
    },
  ],
  tutor: [
    {
      icon: BadgeCheck,
      title: "Xác thực hồ sơ",
      description: "Hoàn thiện hồ sơ, chờ duyệt và xác thực chứng chỉ môn dạy.",
    },
    {
      icon: Send,
      title: "Ứng tuyển",
      description: "Chọn lớp thuộc môn đã được xác thực và gửi đơn.",
    },
    {
      icon: Handshake,
      title: "Nhận lớp",
      description: "Khi được chọn, thanh toán phí và xác nhận lớp học.",
    },
    {
      icon: GraduationCap,
      title: "Dạy và tạo uy tín",
      description: "Hoàn thành lớp và nhận đánh giá từ học viên.",
    },
  ],
};

export function HowItWorksSection() {
  const [role, setRole] = useState<Role>("student");

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="flex flex-col items-center gap-6"
    >
      <div className="text-center">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-extrabold text-text"
        >
          TutorLink hoạt động thế nào
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Bốn bước từ lúc bắt đầu đến khi hoàn thành lớp học
        </p>
      </div>

      <div
        role="group"
        aria-label="Chọn vai trò"
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            aria-pressed={role === tab.role}
            onClick={() => setRole(tab.role)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-bold transition-colors",
              role === tab.role
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ol className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS[role].map(({ icon: Icon, title, description }, index) => (
          <li
            key={title}
            className="relative rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span
              aria-hidden="true"
              className="absolute right-5 top-4 text-3xl font-extrabold text-primary/20"
            >
              {index + 1}
            </span>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-bold text-text">{title}</h3>
            <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
