import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { SUBJECT_FORM_NAME_MAX_LENGTH } from "@/features/subject/constants/subject.constants";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import {
  useSubjectMutations,
  useSubjects,
} from "@/features/subject/hooks/useSubjects";
import type {
  SubjectPayload,
  SubjectResponse,
} from "@/features/subject/types/subject.types";

const NO_KNOWN_FIELDS = [] as const;

export default function AdminSubjectsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useSubjects();
  const { create, update, remove } = useSubjectMutations();
  const [editing, setEditing] = useState<SubjectResponse | "new" | null>(null);
  const [deleting, setDeleting] = useState<SubjectResponse | null>(null);
  // Môn mà BE từ chối xóa vì đang được sử dụng: disable nút Xóa trong modal
  const [inUseIds, setInUseIds] = useState<string[]>([]);
  const form = useForm<SubjectPayload>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Đổi ngôn ngữ: validate lại ô đang lỗi để chữ lỗi đổi theo
  useServerFormErrors(form, NO_KNOWN_FIELDS);

  const open = (s: SubjectResponse | "new") => {
    setEditing(s);
    reset(
      s === "new"
        ? {
            name: "",
            description: "",
            category: "" as SubjectPayload["category"],
          }
        : {
            name: s.name,
            description: s.description ?? "",
            category: s.category,
          },
    );
  };

  const isInUse = (s: SubjectResponse) =>
    (s.usageCount ?? 0) > 0 || inUseIds.includes(s.id);

  const deletingInUse = deleting ? isInUse(deleting) : false;

  const submit = handleSubmit((v) => {
    const opts = {
      onSuccess: () => {
        toast.success(t("adminSubjects.saved"));
        setEditing(null);
      },
      onError: (e: unknown) => toast.apiError(e),
    };
    if (editing === "new") {
      create.mutate(v, opts);
    } else if (editing) {
      update.mutate({ id: editing.id, payload: v }, opts);
    }
  });

  const confirmDelete = () => {
    if (!deleting) {
      return;
    }
    const subject = deleting;
    remove.mutate(subject.id, {
      onSuccess: () => {
        toast.success(t("adminSubjects.deleted"));
        setDeleting(null);
      },
      // BE từ chối: giữ modal mở, lúc này deletingInUse = true nên nút Xóa bị disable
      onError: () => setInUseIds((ids) => [...ids, subject.id]),
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={t("adminSubjects.title")}
        actions={
          <Button onClick={() => open("new")}>
            <Plus className="size-4" /> {t("adminSubjects.add")}
          </Button>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {data?.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div>
                <p className="font-semibold text-text">{s.name}</p>
                <p className="text-xs text-text-secondary">
                  {s.usageCount === undefined
                    ? s.category
                    : t("adminSubjects.usage", { count: s.usageCount })}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("adminSubjects.editAria", { name: s.name })}
                  onClick={() => open(s)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("adminSubjects.deleteAria", { name: s.name })}
                  onClick={() => setDeleting(s)}
                >
                  <Trash2 className="size-4 text-danger-text" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editing === "new"
            ? t("adminSubjects.addTitle")
            : t("adminSubjects.editTitle")
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              onClick={() => void submit()}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <Input
            label={t("adminSubjects.nameLabel")}
            required
            error={errors.name?.message}
            {...register("name", {
              required: t("adminSubjects.nameRequired"),
              maxLength: {
                value: SUBJECT_FORM_NAME_MAX_LENGTH,
                message: t("adminSubjects.maxChars", {
                  max: SUBJECT_FORM_NAME_MAX_LENGTH,
                }),
              },
            })}
          />
          <Input
            label={t("adminSubjects.categoryLabel")}
            required
            error={errors.category?.message}
            {...register("category", {
              required: t("adminSubjects.categoryRequired"),
            })}
          />
          <Input
            label={t("adminSubjects.descriptionLabel")}
            {...register("description")}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t("adminSubjects.deleteTitle")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={deletingInUse}
              onClick={confirmDelete}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          <Trans
            i18nKey="adminSubjects.deleteConfirm"
            values={{ name: deleting?.name ?? "" }}
            components={{ strong: <strong /> }}
          />
        </p>
        {deletingInUse && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-text"
          >
            {t("adminSubjects.inUse")}
          </p>
        )}
      </Modal>
    </div>
  );
}
