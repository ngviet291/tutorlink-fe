import { useState } from "react";
import { SUBJECT_FORM_NAME_MAX_LENGTH } from "@/features/subject/constants/subject.constants";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { getErrorMessage } from "@/shared/utils/errors";
import { useToast } from "@/shared/hooks/useToast";
import {
  useSubjectMutations,
  useSubjects,
} from "@/features/subject/hooks/useSubjects";
import type {
  SubjectPayload,
  SubjectResponse,
} from "@/features/subject/types/subject.types";

const SUBJECT_IN_USE_MESSAGE = "Môn học đang được sử dụng nên không thể xóa.";

export default function AdminSubjectsPage() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useSubjects();
  const { create, update, remove } = useSubjectMutations();
  const [editing, setEditing] = useState<SubjectResponse | "new" | null>(null);
  const [deleting, setDeleting] = useState<SubjectResponse | null>(null);
  // Môn mà BE từ chối xóa vì đang được sử dụng: disable nút Xóa trong modal
  const [inUseIds, setInUseIds] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectPayload>();

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
        toast.success("Đã lưu môn học");
        setEditing(null);
      },
      onError: (e: unknown) => toast.error(getErrorMessage(e)),
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
        toast.success("Đã xóa môn học");
        setDeleting(null);
      },
      // BE từ chối: giữ modal mở, lúc này deletingInUse = true nên nút Xóa bị disable
      onError: () => setInUseIds((ids) => [...ids, subject.id]),
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Quản lý môn học"
        actions={
          <Button onClick={() => open("new")}>
            <Plus className="size-4" /> Thêm môn
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
                    : `Đang được dùng ở ${s.usageCount} bài đăng/hồ sơ`}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Sửa ${s.name}`}
                  onClick={() => open(s)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Xóa ${s.name}`}
                  onClick={() => setDeleting(s)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Thêm môn học" : "Sửa môn học"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              onClick={() => void submit()}
            >
              Lưu
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <Input
            label="Tên môn học"
            required
            error={errors.name?.message}
            {...register("name", {
              required: "Tên môn học là bắt buộc",
              maxLength: {
                value: SUBJECT_FORM_NAME_MAX_LENGTH,
                message: `Tối đa ${SUBJECT_FORM_NAME_MAX_LENGTH} ký tự`,
              },
            })}
          />
          <Input
            label="Nhóm môn"
            required
            error={errors.category?.message}
            {...register("category", { required: "Nhóm môn là bắt buộc" })}
          />
          <Input label="Mô tả" {...register("description")} />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa môn học?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={deletingInUse}
              onClick={confirmDelete}
            >
              Xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Xóa môn <strong>{deleting?.name}</strong>?
        </p>
        {deletingInUse && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300"
          >
            {SUBJECT_IN_USE_MESSAGE}
          </p>
        )}
      </Modal>
    </div>
  );
}
