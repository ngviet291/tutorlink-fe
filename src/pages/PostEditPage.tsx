import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Spinner } from '@/shared/components/ui/Spinner'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { ROUTES } from '@/constants/routes'
import { usePost, usePostMutations } from '@/features/post/hooks/usePosts'
import { PostForm } from '@/features/post/components/PostForm'
import type { PostPayload } from '@/features/post/types/post.types'

export default function PostEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { id = '' } = useParams<{ id: string }>()
  const { data: post, isLoading, isError } = usePost(id, { mine: true })
  const { updatePost } = usePostMutations()

  // Lưu nháp: cập nhật + chuyển về DRAFT (kể cả bài đang tuyển → gỡ khỏi công khai).
  // Đăng bài: cập nhật + chuyển sang PUBLISHED.
  const handleSubmit = async (payload: PostPayload, asDraft = false) => {
    try {
      await updatePost.mutateAsync({
        id,
        payload,
        status: asDraft ? 'DRAFT' : 'PUBLISHED',
      })
      toast.success(asDraft ? t('post.draftSaved') : t('post.publishSuccess'))
      navigate(asDraft ? ROUTES.MY_POSTS : ROUTES.POST_DETAIL(id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !post) {
    return <ErrorState message={t('post.notFound')} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader title={t('post.editPost')} />
      <div className="mt-6">
        <PostForm
          defaultValues={post}
          onSubmit={handleSubmit}
          isSubmitting={updatePost.isPending}
        />
      </div>
    </div>
  )
}
