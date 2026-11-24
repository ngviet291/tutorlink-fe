import { useState } from "react";
import { BadgeCheck, Clock, Plus, ShieldQuestion, Trash2 } from "lucide-react";
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import {
  useDeleteCertificate,
  useMyCertificates,
  useUploadCertificates,
} from "../hooks/useTutors";

const MAX_CERTIFICATES = 10; // khớp app.certificate.max-per-tutor của BE

interface SubjectGroup {
  id: string;
  name: string;
  certificates: CertificateResponse[];
}

function CertificateItem({
  certificate,
  onDelete,
  deleting,
}: {
  certificate: CertificateResponse;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={certificate.fileUrl}
          alt={certificate.name ?? "Ảnh chứng chỉ"}
          className="size-14 rounded-lg border border-border object-cover"
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {certificate.name ?? "Đang chờ hệ thống đọc thông tin..."}
        </p>
        {certificate.pendingAdminReview && !certificate.verified && (
          <p className="text-xs text-text-secondary">
            Hệ thống chưa tự xác thực được, admin sẽ xem xét thủ công.
          </p>
        )}
        {certificate.issuedBy && (
          <p className="truncate text-xs text-text-secondary">
            {certificate.issuedBy}
            {certificate.issuedDate ? ` · ${certificate.issuedDate}` : ""}
          </p>
        )}
      </div>
      {certificate.verified ? (
        <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
          Đã xác thực
        </Badge>
      ) : certificate.pendingAdminReview ? (
        <Badge tone="blue" icon={<ShieldQuestion className="size-3" />}>
          Chờ admin duyệt
        </Badge>
      ) : (
        <Badge tone="yellow" icon={<Clock className="size-3" />}>
          Đang duyệt
        </Badge>
      )}
      <Button
        variant="ghost"
        aria-label="Xóa chứng chỉ"
        loading={deleting}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-danger-text" />
      </Button>
    </li>
  );
}

/** Thêm môn học mới: bấm nút mới hiện form, mỗi môn đúng 1 chứng chỉ (1 ảnh). */
function AddSubject({ takenIds, room }: { takenIds: string[]; room: number }) {
  const toast = useToast();
  const { data: subjects = [] } = useSubjects();
  const upload = useUploadCertificates();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [pending, setPending] = useState<File[]>([]);

  const options = subjects
    .filter((s) => !takenIds.includes(s.id))
    .map((s) => ({ value: s.id, label: s.name }));

  const close = () => {
    setOpen(false);
    setSubjectId("");
    setPending([]);
  };

  const submit = () =>
    upload.mutate(
      { subjectId, files: pending },
      {
        onSuccess: () => {
          close();
          toast.success(
            "Đã thêm môn học, chứng chỉ đang được kiểm tra. Nếu hệ thống chưa tự xác thực được, admin sẽ duyệt giúp bạn",
          );
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  if (room <= 0) {
    return (
      <p className="text-xs text-text-secondary">
        Đã đạt tối đa {MAX_CERTIFICATES} chứng chỉ, hãy xóa bớt trước khi thêm
        môn mới.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" /> Thêm môn học mới
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4">
      <h3 className="font-semibold text-text">Thêm môn học mới</h3>
      <Select
        label="Môn học"
        placeholder="Chọn môn học"
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        options={options}
      />
      {subjectId && (
        <>
          <p className="text-xs text-text-secondary">
            Tải 1 ảnh chứng chỉ / bằng cấp cho môn này. Chưa có chứng chỉ thì
            môn học chưa được xác nhận.
          </p>
          <CertificateUpload
            value={pending}
            onChange={setPending}
            maxFiles={1}
          />
        </>
      )}
      <div className="flex gap-2">
        <Button
          disabled={!subjectId || pending.length === 0}
          loading={upload.isPending}
          onClick={submit}
        >
          Tải lên và thêm môn
        </Button>
        <Button variant="ghost" disabled={upload.isPending} onClick={close}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

export function MyCertificates() {
  const toast = useToast();
  const { data = [], isLoading } = useMyCertificates();
  const remove = useDeleteCertificate();
  const room = MAX_CERTIFICATES - data.length;
  const deletingId = remove.isPending ? (remove.variables ?? null) : null;

  const handleDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success("Đã xóa chứng chỉ"),
      onError: (e) => toast.error(getErrorMessage(e)),
    });

  // Gom chứng chỉ theo môn; chứng chỉ cũ chưa gắn môn để riêng
  const groups: SubjectGroup[] = [];
  const orphans: CertificateResponse[] = [];
  for (const c of data) {
    if (!c.subjectId) {
      orphans.push(c);
      continue;
    }
    let group = groups.find((g) => g.id === c.subjectId);
    if (!group) {
      group = {
        id: c.subjectId,
        name: c.subjectName ?? "Môn học",
        certificates: [],
      };
      groups.push(group);
    }
    group.certificates.push(c);
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Môn học và chứng chỉ">
      <h2 className="text-sm font-medium text-text">Môn học và chứng chỉ</h2>
      <p className="text-xs text-text-secondary">
        Mỗi môn học cần có chứng chỉ. Môn có chứng chỉ đã xác thực mới đăng bài
        và nhận lớp được.
      </p>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          {groups.length === 0 && orphans.length === 0 && (
            <p className="text-sm text-text-secondary">
              Chưa có môn học nào. Hãy thêm môn học và chứng chỉ ở bên dưới.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-text">{g.name}</h3>
                  {g.certificates.some((c) => c.verified) ? (
                    <Badge
                      tone="green"
                      icon={<BadgeCheck className="size-3" />}
                    >
                      Môn đã xác nhận
                    </Badge>
                  ) : g.certificates.some((c) => c.pendingAdminReview) ? (
                    <Badge
                      tone="blue"
                      icon={<ShieldQuestion className="size-3" />}
                    >
                      Chờ admin duyệt
                    </Badge>
                  ) : (
                    <Badge tone="yellow" icon={<Clock className="size-3" />}>
                      Chờ xác nhận chứng chỉ
                    </Badge>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {g.certificates.map((c) => (
                    <CertificateItem
                      key={c.id}
                      certificate={c}
                      deleting={deletingId === c.id}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {orphans.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-secondary">
                Chứng chỉ chưa gắn môn (hãy xóa và tải lại ở đúng môn):
              </p>
              <ul className="flex flex-col gap-2">
                {orphans.map((c) => (
                  <CertificateItem
                    key={c.id}
                    certificate={c}
                    deleting={deletingId === c.id}
                    onDelete={() => handleDelete(c.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          <AddSubject takenIds={groups.map((g) => g.id)} room={room} />
        </>
      )}
    </section>
  );
}
