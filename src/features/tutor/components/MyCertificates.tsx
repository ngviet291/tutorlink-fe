import { useState } from "react";
import { BadgeCheck, Clock, Trash2 } from "lucide-react";
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import { useDeleteCertificate, useMyCertificates, useUploadCertificates } from "../hooks/useTutors";

const MAX_CERTIFICATES = 10;   // khớp app.certificate.max-per-tutor của BE
const MAX_FILES_PER_UPLOAD = 5; // khớp @ValidImageFiles(maxFiles = 5)

function CertificateItem({ certificate, onDelete, deleting }: {
  certificate: CertificateResponse; onDelete: () => void; deleting: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
        <img src={certificate.fileUrl} alt={certificate.name ?? "Ảnh chứng chỉ"}
          className="size-14 rounded-lg border border-border object-cover" />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {certificate.name ?? "Đang chờ hệ thống đọc thông tin..."}
        </p>
        {certificate.issuedBy && (
          <p className="truncate text-xs text-text-secondary">
            {certificate.issuedBy}{certificate.issuedDate ? ` · ${certificate.issuedDate}` : ""}
          </p>
        )}
      </div>
      {certificate.verified ? (
        <Badge tone="green" icon={<BadgeCheck className="size-3" />}>Đã xác thực</Badge>
      ) : (
        <Badge tone="yellow" icon={<Clock className="size-3" />}>Đang duyệt</Badge>
      )}
      <Button variant="ghost" aria-label="Xóa chứng chỉ" loading={deleting} onClick={onDelete}>
        <Trash2 className="size-4 text-danger" />
      </Button>
    </li>
  );
}

export function MyCertificates() {
  const toast = useToast();
  const { data = [], isLoading } = useMyCertificates();
  const upload = useUploadCertificates();
  const remove = useDeleteCertificate();
  const [pending, setPending] = useState<File[]>([]);
  const room = MAX_CERTIFICATES - data.length;

  const submit = () =>
    upload.mutate(pending, {
      onSuccess: () => { setPending([]); toast.success("Đã tải lên, chứng chỉ đang được hệ thống kiểm tra"); },
      onError: (e) => toast.error(getErrorMessage(e)),
    });

  const handleDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success("Đã xóa chứng chỉ"),
      onError: (e) => toast.error(getErrorMessage(e)),
    });

  return (
    <section className="flex flex-col gap-3" aria-label="Chứng chỉ">
      <h2 className="text-sm font-medium text-text">Chứng chỉ / Bằng cấp</h2>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : data.length === 0 ? (
        <p className="text-sm text-text-secondary">Chưa có chứng chỉ nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((c) => (
            <CertificateItem key={c.id} certificate={c}
              deleting={remove.isPending && remove.variables === c.id}
              onDelete={() => handleDelete(c.id)} />
          ))}
        </ul>
      )}
      {room > 0 ? (
        <>
          <CertificateUpload value={pending} onChange={setPending}
            maxFiles={Math.min(MAX_FILES_PER_UPLOAD, room)} />
          {pending.length > 0 && (
            <Button className="w-fit" loading={upload.isPending} onClick={submit}>
              Tải lên {pending.length} ảnh
            </Button>
          )}
        </>
      ) : (
        <p className="text-xs text-text-secondary">
          Đã đạt tối đa {MAX_CERTIFICATES} chứng chỉ, hãy xóa bớt trước khi tải thêm.
        </p>
      )}
    </section>
  );
}