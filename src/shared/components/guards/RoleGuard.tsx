import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import type { Role } from '@/shared/types/common.types'

interface RoleGuardProps {
  allow: Role[]
}

/** Admin có toàn bộ chức năng của Học viên và Gia sư nên luôn được cho qua. */
export function RoleGuard({ allow }: RoleGuardProps) {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (user.role === 'ADMIN' || allow.includes(user.role)) return <Outlet />
  return <Navigate to={ROUTES.DASHBOARD} replace />
}
