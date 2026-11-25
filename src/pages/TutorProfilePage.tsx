import { useEffect } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { SubjectProfilesEditor } from "@/features/tutor/components/SubjectProfilesEditor";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import {
  useReloadTutorProfile,
  useTutorProfile,
} from "@/features/tutor/hooks/useTutors";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";

function StatusBanner({ tutor }: { tutor: TutorResponse }) {
  const map = {
    PENDING: {
      Icon: Clock,
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
      title: "Hồ sơ đang chờ Admin duyệt",
      body: "Bạn chưa hiển thị công khai và chưa thể đăng ký nhận lớp. Chúng tôi sẽ thông báo ngay khi có kết quả.",
    },
    APPROVED: {
      Icon: CheckCircle2,
      cls: "bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200",
      title: "Hồ sơ đã được duyệt",
      body: "Hồ sơ của bạn đã hiển thị công khai. Bạn có thể đăng ký nhận lớp.",
    },
    REJECTED: {
      Icon: XCircle,
      cls: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
      title: "Hồ sơ bị từ chối",
      body: "Vui lòng xem ghi chú của Admin, chỉnh sửa và gửi lại.",
    },
  }[tutor.verificationStatus];
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl p-4 ${map.cls}`}>
      <map.Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-bold">{map.title}</p>
        <p className="text-sm opacity-90">{map.body}</p>
        {tutor.verificationNote && (
          <p className="mt-2 rounded-lg bg-white/60 p-2 text-sm dark:bg-black/20">
            <strong>Ghi chú của Admin:</strong> {tutor.verificationNote}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TutorProfilePage() {
  const data = useTutorProfile();
  const { reload, isError } = useReloadTutorProfile();

  // Redux đã có sẵn hồ sơ từ lúc login/F5; tải lại nhẹ khi vào trang để lấy trạng thái duyệt mới nhất
  useEffect(() => {
    void reload();
  }, [reload]);

  if (!data) {
    return isError ? (
      <ErrorState onRetry={() => void reload()} />
    ) : (
      <Skeleton className="mx-auto h-96 max-w-3xl" />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Hồ sơ giảng dạy"
        description="Thông tin này hiển thị công khai khi hồ sơ được duyệt (trừ thông tin liên hệ)."
      />
      <StatusBanner tutor={data} />
      <SubjectProfilesEditor data={data} />
    </div>
  );
}
