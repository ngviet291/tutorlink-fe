import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Clock, Plus, ShieldQuestion, Trash2 } from "lucide-react";
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
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
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={certificate.fileUrl}
          alt={certificate.name ?? t("subjectEditor.certAlt")}
          className="size-14 rounded-lg border border-border object-cover"
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {certificate.name ?? t("subjectEditor.certPending")}
        </p>
        {certificate.pendingAdminReview && !certificate.verified && (
          <p className="text-xs text-text-secondary">
            {t("myCertificates.adminReviewNote")}
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
          {t("subjectEditor.certVerified")}
        </Badge>
      ) : certificate.pendingAdminReview ? (
        <Badge tone="blue" icon={<ShieldQuestion className="size-3" />}>
          {t("myCertificates.pendingAdmin")}
        </Badge>
      ) : (
        <Badge tone="yellow" icon={<Clock className="size-3" />}>
          {t("subjectEditor.certReviewing")}
        </Badge>
      )}
      <Button
        variant="ghost"
        aria-label={t("subjectEditor.deleteCertAria")}
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
  const { t } = useTranslation();
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
          toast.success(t("myCertificates.added"));
        },
        onError: (e) => toast.apiError(e),
      },
    );

  if (room <= 0) {
    return (
      <p className="text-xs text-text-secondary">
        {t("myCertificates.maxReached", { max: MAX_CERTIFICATES })}
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
        <Plus className="size-4" /> {t("subjectEditor.addSubject")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4">
      <h3 className="font-semibold text-text">
        {t("subjectEditor.addSubject")}
      </h3>
      <Select
        label={t("subjectEditor.subject")}
        placeholder={t("subjectEditor.pickSubject")}
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        options={options}
      />
      {subjectId && (
        <>
          <p className="text-xs text-text-secondary">
            {t("myCertificates.uploadHint")}
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
          {t("myCertificates.uploadAndAdd")}
        </Button>
        <Button variant="ghost" disabled={upload.isPending} onClick={close}>
          {t("subjectEditor.cancel")}
        </Button>
      </div>
    </div>
  );
}

export function MyCertificates() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data = [], isLoading } = useMyCertificates();
  const remove = useDeleteCertificate();
  const room = MAX_CERTIFICATES - data.length;
  const deletingId = remove.isPending ? (remove.variables ?? null) : null;

  const handleDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success(t("subjectEditor.certDeleted")),
      onError: (e) => toast.apiError(e),
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
        name: c.subjectName ?? t("myCertificates.subjectFallback"),
        certificates: [],
      };
      groups.push(group);
    }
    group.certificates.push(c);
  }

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t("myCertificates.title")}
    >
      <h2 className="text-sm font-medium text-text">
        {t("myCertificates.title")}
      </h2>
      <p className="text-xs text-text-secondary">{t("myCertificates.hint")}</p>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          {groups.length === 0 && orphans.length === 0 && (
            <p className="text-sm text-text-secondary">
              {t("myCertificates.empty")}
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
                      {t("subjectEditor.confirmedBadge")}
                    </Badge>
                  ) : g.certificates.some((c) => c.pendingAdminReview) ? (
                    <Badge
                      tone="blue"
                      icon={<ShieldQuestion className="size-3" />}
                    >
                      {t("myCertificates.pendingAdmin")}
                    </Badge>
                  ) : (
                    <Badge tone="yellow" icon={<Clock className="size-3" />}>
                      {t("myCertificates.awaitingCert")}
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
                {t("subjectEditor.orphanCerts")}
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
