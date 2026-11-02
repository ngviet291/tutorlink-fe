import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppDispatch } from '@/shared/hooks/useAppStore'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { userService } from '@/features/user/service/user.service'
import { setUser } from '../store/authSlice'
import { tokenStorage } from '../store/tokenStorage'

/**
 * Khôi phục phiên đăng nhập khi tải lại trang: nếu còn token thì lấy thông tin user (mock hoặc API thật).
 * Render children sau khi khôi phục xong để guard không đá người dùng về /login oan.
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const [ready, setReady] = useState(() => !tokenStorage.getAccessToken())

  useEffect(() => {
    if (ready) return
    let cancelled = false
    userService
      .getMe()
      .then((user) => { if (!cancelled) dispatch(setUser(user)) })
      .catch(() => tokenStorage.clearTokens())
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [dispatch, ready])

  if (!ready) return <PageSpinner />
  return <>{children}</>
}
