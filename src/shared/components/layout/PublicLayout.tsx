import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ChatbotWidget } from '@/features/chatbot/components/ChatbotWidget'

export function PublicLayout() {
  const role = useAppSelector((s) => s.auth.user?.role)
  const { pathname } = useLocation()
  // Admin không dùng trang chủ công khai: vào / thì chuyển sang /admin.
  if (role === 'ADMIN' && pathname === ROUTES.HOME) {
    return <Navigate to={ROUTES.ADMIN} replace />
  }
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  )
}
