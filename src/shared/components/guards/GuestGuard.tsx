import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppSelector } from '@/shared/hooks/useAppStore'

export function GuestGuard() {
  const isAuthenticated = useAppSelector((s) => s.auth.user !== null)
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return <Outlet />
}
