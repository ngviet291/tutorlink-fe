import {
  Bell,
  BookOpen,
  CircleDollarSign,
  FileText,
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
} from "lucide-react";
import i18n from "@/app/i18n";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/shared/types/common.types";

// Giữ nguyên tên `label` / `title` để Sidebar, MobileBottomNav không phải sửa kiểu.
// Chữ được dịch lúc đọc (getter), nên đổi VI/EN có hiệu lực khi component render lại.
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface PublicNavItem {
  to: string;
  labelKey: string;
  /** Vai trò không thấy mục này (khách chưa đăng nhập được coi là học viên). */
  hideFor?: Role[];
  /** Chỉ hiện khi đã đăng nhập (khách không thấy). */
  authOnly?: boolean;
}

// Thứ tự hiển thị trên Navbar: Trang chủ, Tìm gia sư, Tìm lớp, Đăng bài,
// Góc gia sư, Góc học viên, Ví, Tin nhắn.
export const PUBLIC_NAV: PublicNavItem[] = [
  { to: ROUTES.HOME, labelKey: "nav.home" },
  { to: ROUTES.FIND_TUTOR, labelKey: "nav.findTutor", hideFor: ["TUTOR"] },
  { to: ROUTES.FIND_CLASS, labelKey: "nav.findClass" },
  { to: ROUTES.POST_CREATE, labelKey: "nav.postCreate", authOnly: true },
  {
    to: ROUTES.TUTOR_CORNER,
    labelKey: "nav.tutorCorner",
    hideFor: ["STUDENT"],
  },
  {
    to: ROUTES.STUDENT_CORNER,
    labelKey: "nav.studentCorner",
    hideFor: ["TUTOR"],
  },
];

export function getPublicNav(role?: Role): PublicNavItem[] {
  if (role === "ADMIN") return [];
  const effective: Role = role ?? "STUDENT";
  return PUBLIC_NAV.filter((i) => {
    if (i.authOnly && !role) return false;
    return !i.hideFor?.includes(effective);
  });
}

/** Tạo một mục menu có nhãn dịch theo ngôn ngữ hiện tại (key nằm trong nav.items.*). */
function navItem(
  to: string,
  key: string,
  icon: LucideIcon,
  end?: boolean,
): NavItem {
  return {
    to,
    icon,
    end,
    get label() {
      return i18n.t(`nav.items.${key}`);
    },
  };
}

// end: true vì /profile là tiền tố của /profile/tutor, không có end thì
// đứng ở Hồ sơ giảng dạy nút Tài khoản vẫn sáng.
const accountItem = navItem(ROUTES.PROFILE, "account", User, true);

const common: NavItem[] = [
  navItem(ROUTES.CHAT_INBOX, "messages", MessageSquare, true),
  navItem(ROUTES.NOTIFICATIONS, "notifications", Bell),
  accountItem,
];

const studentItems: NavItem[] = [
  navItem(ROUTES.DASHBOARD, "overview", LayoutDashboard, true),
  navItem(ROUTES.POST_CREATE, "postCreate", PlusCircle),
  navItem(ROUTES.MY_POSTS, "myPosts", FileText),
  navItem(ROUTES.MY_APPLICATIONS, "myApplications", BookOpen),
  navItem(ROUTES.FAVORITES, "favorites", Heart),
];

const tutorItems: NavItem[] = [
  navItem(ROUTES.DASHBOARD, "overview", LayoutDashboard, true),
  navItem(ROUTES.TUTOR_PROFILE, "tutorProfile", GraduationCap),
  navItem(ROUTES.POST_CREATE, "postCreateTutor", PlusCircle),
  navItem(ROUTES.MY_POSTS, "myPosts", FileText),
  navItem(ROUTES.MY_APPLICATIONS, "myApplications", BookOpen),
  navItem(ROUTES.WALLET, "wallet", Wallet),
];

const adminItems: NavItem[] = [
  navItem(ROUTES.ADMIN, "adminStats", BarChart3, true),
  navItem(ROUTES.ADMIN_TUTOR_REVIEW, "adminTutorReview", ShieldCheck),
  navItem(ROUTES.ADMIN_USERS, "adminUsers", Users),
  navItem(ROUTES.ADMIN_SUBJECTS, "adminSubjects", Tags),
  navItem(ROUTES.ADMIN_POSTS, "adminPosts", FileText),
  navItem(ROUTES.ADMIN_TRANSACTIONS, "adminTransactions", Receipt),
  navItem(ROUTES.ADMIN_WITHDRAWALS, "adminWithdrawals", Wallet),
  navItem(ROUTES.ADMIN_FEE, "adminFee", CircleDollarSign),
  navItem(ROUTES.ADMIN_COMPLAINTS, "adminComplaints", Flag),
];

export function getNavGroups(role: Role): NavGroup[] {
  if (role === "ADMIN") {
    return [
      {
        get title() {
          return i18n.t("nav.items.adminTitle");
        },
        items: adminItems,
      },
      { items: [accountItem] },
    ];
  }
  if (role === "TUTOR") return [{ items: [...tutorItems, ...common] }];
  return [{ items: [...studentItems, ...common] }];
}

/** 4–5 mục quan trọng nhất cho thanh điều hướng đáy trên mobile */
export function getBottomNav(role: Role): NavItem[] {
  if (role === "ADMIN") {
    return [
      adminItems[0]!,
      adminItems[1]!,
      adminItems[5]!,
      navItem(ROUTES.PROFILE, "account", Settings2, true),
    ];
  }
  if (role === "TUTOR") {
    return [
      tutorItems[0]!,
      tutorItems[4]!,
      tutorItems[5]!,
      navItem(ROUTES.NOTIFICATIONS, "notifications", Bell),
      navItem(ROUTES.PROFILE, "account", UserCog, true),
    ];
  }
  return [
    studentItems[0]!,
    studentItems[1]!,
    studentItems[2]!,
    navItem(ROUTES.NOTIFICATIONS, "notifications", Bell),
    navItem(ROUTES.PROFILE, "account", User, true),
  ];
}
