import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { Tabs } from '@/shared/components/ui/Tabs'
import { PostCard } from '@/features/post/components/PostCard'
import { useMyPosts } from '@/features/post/hooks/usePosts'
import type { PostStatus } from '@/shared/types/common.types'

type Filter = PostStatus | 'ALL'

export default function MyPostsPage() {
  const { data, isLoading, isError, refetch } = useMyPosts()
  const [tab, setTab] = useState<Filter>('ALL')
  const list = (data ?? []).filter((p) => tab === 'ALL' || p.status === tab)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        title="Bài đăng của tôi"
        description="Lịch sử bài đăng và các lớp đã kết nối."
        actions={<Link to={ROUTES.POST_CREATE}><Button><Plus className="size-4" /> Đăng bài mới</Button></Link>}
      />
      <Tabs<Filter>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'ALL', label: 'Tất cả' }, { value: 'DRAFT', label: 'Bản nháp' }, { value: 'PUBLISHED', label: 'Đang tuyển' },
          { value: 'CLOSED', label: 'Đã đủ' }, { value: 'REMOVED', label: 'Đã gỡ' },
        ]}
      />
      {isLoading ? <CardGridSkeleton count={3} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : list.length === 0 ? (
        <EmptyState title="Chưa có bài đăng" action={<Link to={ROUTES.POST_CREATE}><Button>Tạo bài đăng đầu tiên</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
    </div>
  )
}
