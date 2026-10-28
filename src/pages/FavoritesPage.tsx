import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { TutorCard } from '@/features/tutor/components/TutorCard'
import { useFavorites } from '@/features/favorite/hooks/useFavorites'

export default function FavoritesPage() {
  const { data, isLoading, isError, refetch } = useFavorites()
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader title="Gia sư yêu thích" />
      {isLoading ? <CardGridSkeleton count={3} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState title="Chưa có gia sư yêu thích" action={<Link to={ROUTES.FIND_TUTOR}><Button>Khám phá gia sư</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((t) => <TutorCard key={t.id} tutor={t} />)}</div>
      )}
    </div>
  )
}
