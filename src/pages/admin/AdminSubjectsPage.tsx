import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { SUBJECT_FORM_NAME_MAX_LENGTH } from "@/features/subject/constants/subject.constants";
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
  const { create, remove } = useSubjectMutations();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SubjectResponse | null>(null);

  // Môn mà BE từ chối xóa vì đang được sử dụng
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

  const openCreate = () => {
    setCreating(true);

    reset({
      name: "",
      description: "",
      category: "" as SubjectPayload["category"],
    });
  };

  const isInUse = (s: SubjectResponse) =>
    (s.usageCount ?? 0) > 0 || inUseIds.includes(s.id);

  const deletingInUse = deleting ? isInUse(deleting) : false;

  const submit = handleSubmit((v) => {
    create.mutate(v, {
      onSuccess: () => {
        toast.success(t("adminSubjects.saved"));
        setCreating(false);
        reset();
      },
      onError: (e: unknown) => {
        toast.apiError(e);
      },
    });
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

      // BE từ chối xóa vì môn đang được sử dụng
      onError: () => {
        setInUseIds((ids) =>
          ids.includes(subject.id) ? ids : [...ids, subject.id],
        );
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={t("adminSubjects.title")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("adminSubjects.add")}
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
                    : t("adminSubjects.usage", {
                        count: s.usageCount,
                      })}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("adminSubjects.deleteAria", {
                    name: s.name,
                  })}
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
        open={creating}
        onClose={() => setCreating(false)}
        title={t("adminSubjects.addTitle")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCreating(false)}
              disabled={create.isPending}
            >
              {t("common.cancel")}
            </Button>

            <Button loading={create.isPending} onClick={() => void submit()}>
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
            {!deletingInUse && (
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={confirmDelete}
              >
                {t("common.delete")}
              </Button>
            )}
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
