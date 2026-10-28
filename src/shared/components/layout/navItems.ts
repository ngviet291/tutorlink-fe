import {
  Bell,
  BookOpen,
  CircleDollarSign,
  FileText,
  Gauge,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Receipt,
  Settings2,
  ShieldCheck,
  Tags,
  User,
  UserCog,
  Users,
  Wallet,
  BarChart3,
  Flag,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/shared/types/common.types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

export const PUBLIC_NAV: { to: string; labelKey: string }[] = [
  { to: ROUTES.HOME, labelKey: 'nav.home' },
  { to: ROUTES.FIND_TUTOR, labelKey: 'nav.findTutor' },
  { to: ROUTES.FIND_CLASS, labelKey: 'nav.findClass' },
  { to: ROUTES.TUTOR_CORNER, labelKey: 'nav.tutorCorner' },
  { to: ROUTES.STUDENT_CORNER, labelKey: 'nav.studentCorner' },
]

const common: NavItem[] = [
  { to: ROUTES.NOTIFICATIONS, label: 'Thông báo', icon: Bell },
  { to: ROUTES.PROFILE, label: 'Tài khoản', icon: User },
]

const studentItems: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.POST_CREATE, label: 'Đăng bài mới', icon: PlusCircle },
  { to: ROUTES.MY_POSTS, label: 'Bài đăng của tôi', icon: FileText },
  { to: ROUTES.FAVORITES, label: 'Gia sư yêu thích', icon: Heart },
]

const tutorItems: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.TUTOR_PROFILE, label: 'Hồ sơ giảng dạy', icon: GraduationCap },
  { to: ROUTES.POST_CREATE, label: 'Đăng tìm học viên', icon: PlusCircle },
  { to: ROUTES.MY_POSTS, label: 'Bài đăng của tôi', icon: FileText },
  { to: ROUTES.MY_APPLICATIONS, label: 'Đơn đã ứng tuyển', icon: BookOpen },
  { to: ROUTES.WALLET, label: 'Ví của tôi', icon: Wallet },
]

const adminItems: NavItem[] = [
  { to: ROUTES.ADMIN, label: 'Thống kê', icon: BarChart3, end: true },
  { to: ROUTES.ADMIN_TUTOR_REVIEW, label: 'Duyệt hồ sơ gia sư', icon: ShieldCheck },
  { to: ROUTES.ADMIN_USERS, label: 'Người dùng', icon: Users },
  { to: ROUTES.ADMIN_SUBJECTS, label: 'Môn học', icon: Tags },
  { to: ROUTES.ADMIN_POSTS, label: 'Bài đăng & đăng ký', icon: FileText },
  { to: ROUTES.ADMIN_TRANSACTIONS, label: 'Giao dịch', icon: Receipt },
  { to: ROUTES.ADMIN_FEE, label: 'Tỉ lệ phí', icon: CircleDollarSign },
  { to: ROUTES.ADMIN_COMPLAINTS, label: 'Khiếu nại đánh giá', icon: Flag },
]

export function getNavGroups(role: Role): NavGroup[] {
  if (role === 'ADMIN') {
    return [
      { title: 'Quản trị', items: adminItems },
      { title: 'Học viên', items: studentItems.slice(0, 2).map((i) => ({ ...i })) },
      { title: 'Gia sư', items: [tutorItems[1]!, tutorItems[4]!, tutorItems[5]!] },
      { items: common },
    ]
  }
  if (role === 'TUTOR') return [{ items: [...tutorItems, ...common] }]
  return [{ items: [...studentItems, ...common] }]
}

/** 4–5 mục quan trọng nhất cho thanh điều hướng đáy trên mobile */
export function getBottomNav(role: Role): NavItem[] {
  if (role === 'ADMIN') {
    return [
      adminItems[0]!,
      adminItems[1]!,
      adminItems[5]!,
      { to: ROUTES.NOTIFICATIONS, label: 'Thông báo', icon: Bell },
      { to: ROUTES.PROFILE, label: 'Tài khoản', icon: Settings2 },
    ]
  }
  if (role === 'TUTOR') {
    return [
      tutorItems[0]!,
      tutorItems[4]!,
      tutorItems[5]!,
      { to: ROUTES.NOTIFICATIONS, label: 'Thông báo', icon: MessageSquare },
      { to: ROUTES.PROFILE, label: 'Tài khoản', icon: UserCog },
    ]
  }
  return [
    studentItems[0]!,
    studentItems[1]!,
    studentItems[2]!,
    { to: ROUTES.NOTIFICATIONS, label: 'Thông báo', icon: Gauge },
    { to: ROUTES.PROFILE, label: 'Tài khoản', icon: User },
  ]
}
