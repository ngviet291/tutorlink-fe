import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { AuthGuard } from '@/shared/components/guards/AuthGuard'
import { GuestGuard } from '@/shared/components/guards/GuestGuard'
import { RoleGuard } from '@/shared/components/guards/RoleGuard'
import { PublicLayout } from '@/shared/components/layout/PublicLayout'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { PageSpinner } from '@/shared/components/ui/Spinner'

type Loader = () => Promise<{ default: ComponentType }>

function page(loader: Loader): ReactNode {
  const Comp = lazy(loader)
  return (
    <Suspense fallback={<PageSpinner />}>
      <Comp />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME, element: page(() => import('@/pages/HomePage')) },
      { path: ROUTES.FIND_TUTOR, element: page(() => import('@/pages/FindTutorPage')) },
      { path: ROUTES.FIND_CLASS, element: page(() => import('@/pages/FindClassPage')) },
      { path: ROUTES.TUTOR_DETAIL(), element: page(() => import('@/pages/TutorDetailPage')) },
      { path: ROUTES.POST_DETAIL(), element: page(() => import('@/pages/PostDetailPage')) },
      { path: ROUTES.TUTOR_CORNER, element: page(() => import('@/pages/TutorCornerPage')) },
      { path: ROUTES.STUDENT_CORNER, element: page(() => import('@/pages/StudentCornerPage')) },
    ],
  },
  {
    element: <GuestGuard />,
    children: [
      { path: ROUTES.LOGIN, element: page(() => import('@/pages/LoginPage')) },
      { path: ROUTES.REGISTER, element: page(() => import('@/pages/RegisterPage')) },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: page(() => import('@/pages/DashboardPage')) },
          { path: ROUTES.POST_CREATE, element: page(() => import('@/pages/PostFormPage')) },
          { path: ROUTES.POST_EDIT(), element: page(() => import('@/pages/PostFormPage')) },
          { path: ROUTES.MY_POSTS, element: page(() => import('@/pages/MyPostsPage')) },
          { path: ROUTES.CHAT(), element: page(() => import('@/pages/ChatPage')) },
          { path: ROUTES.NOTIFICATIONS, element: page(() => import('@/pages/NotificationsPage')) },
          { path: ROUTES.PROFILE, element: page(() => import('@/pages/ProfilePage')) },
          {
            element: <RoleGuard allow={['STUDENT']} />,
            children: [{ path: ROUTES.FAVORITES, element: page(() => import('@/pages/FavoritesPage')) }],
          },
          {
            element: <RoleGuard allow={['TUTOR']} />,
            children: [
              { path: ROUTES.TUTOR_PROFILE, element: page(() => import('@/pages/TutorProfilePage')) },
              { path: ROUTES.MY_APPLICATIONS, element: page(() => import('@/pages/MyApplicationsPage')) },
              { path: ROUTES.WALLET, element: page(() => import('@/pages/WalletPage')) },
            ],
          },
          {
            element: <RoleGuard allow={[]} />,
            children: [
              {
                path: ROUTES.ADMIN,
                children: [
                  { index: true, element: page(() => import('@/pages/admin/AdminStatsPage')) },
                  { path: 'tutor-review', element: page(() => import('@/pages/admin/AdminTutorReviewPage')) },
                  { path: 'users', element: page(() => import('@/pages/admin/AdminUsersPage')) },
                  { path: 'subjects', element: page(() => import('@/pages/admin/AdminSubjectsPage')) },
                  { path: 'posts', element: page(() => import('@/pages/admin/AdminPostsPage')) },
                  { path: 'transactions', element: page(() => import('@/pages/admin/AdminTransactionsPage')) },
                  { path: 'fee-rate', element: page(() => import('@/pages/admin/AdminFeePage')) },
                  { path: 'complaints', element: page(() => import('@/pages/admin/AdminComplaintsPage')) },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
])
