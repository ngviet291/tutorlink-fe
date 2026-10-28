import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { getErrorMessage } from '@/shared/utils/errors'
import { useToast } from '@/shared/hooks/useToast'
import { useSubjectMutations, useSubjects } from '@/features/subject/hooks/useSubjects'
import type { SubjectPayload, SubjectResponse } from '@/features/subject/types/subject.types'

export default function AdminSubjectsPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useSubjects()
  const { create, update, remove } = useSubjectMutations()
  const [editing, setEditing] = useState<SubjectResponse | 'new' | null>(null)
  const [deleting, setDeleting] = useState<SubjectResponse | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectPayload>()

  const open = (s: SubjectResponse | 'new') => {
    setEditing(s)
    reset(s === 'new' ? { name: '', description: '' } : { name: s.name, description: s.description ?? '' })
  }
  const submit = handleSubmit((v) => {
    const opts = { onSuccess: () => { toast.success('Đã lưu môn học'); setEditing(null) }, onError: (e: unknown) => toast.error(getErrorMessage(e)) }
    if (editing === 'new') create.mutate(v, opts)
    else if (editing) update.mutate({ id: editing.id, payload: v }, opts)
  })

  const confirmDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => { toast.success('Đã xóa môn học'); setDeleting(null); setDeleteError('') },
      onError: (e) => setDeleteError(getErrorMessage(e)), // vd: đang được sử dụng → hiển thị ngay trong hộp thoại
    })
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Quản lý môn học" actions={<Button onClick={() => open('new')}><Plus className="size-4" /> Thêm môn</Button>} />
      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {data?.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div><p className="font-semibold text-text">{s.name}</p><p className="text-xs text-text-secondary">Đang được dùng ở {s.usageCount} bài đăng/hồ sơ</p></div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" aria-label={`Sửa ${s.name}`} onClick={() => open(s)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="sm" aria-label={`Xóa ${s.name}`} onClick={() => { setDeleteError(''); setDeleting(s) }}><Trash2 className="size-4 text-danger" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Thêm môn học' : 'Sửa môn học'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button><Button loading={create.isPending || update.isPending} onClick={() => void submit()}>Lưu</Button></>}
      >
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <Input label="Tên môn học" required error={errors.name?.message} {...register('name', { required: 'Tên môn học là bắt buộc', maxLength: { value: 50, message: 'Tối đa 50 ký tự' } })} />
          <Input label="Mô tả" {...register('description')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa môn học?" danger confirmText="Xóa" loading={remove.isPending} onConfirm={confirmDelete}
        description={<><p>Xóa môn <strong>{deleting?.name}</strong>? Không thể xóa môn đang được sử dụng.</p>{deleteError && <p role="alert" className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-red-700 dark:bg-red-500/20 dark:text-red-300">{deleteError}</p>}</>}
      />
    </div>
  )
}
