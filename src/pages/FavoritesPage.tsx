import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { TutorCard } from '@/features/tutor/components/TutorCard'
import { useFavorites } from '@/features/favorite/hooks/useFavorites'

export default function FavoritesPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useFavorites()
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader title={t('favorites.title')} />
      {isLoading ? <CardGridSkeleton count={3} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState title={t('favorites.empty')} action={<Link to={ROUTES.FIND_TUTOR}><Button>{t('favorites.explore')}</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}</div>
      )}
    </div>
  )
}