import i18n from "@/app/i18n";
import type {
  ApplicationStatus,
  BudgetUnit,
  DayOfWeek,
  PaymentMethod,
  EducationLevel,
  NotificationType,
  PostStatus,
  PostType,
  TeachingMode,
  TransactionStatus,
  TransactionType,
  UserStatus,
  VerificationStatus,
} from "@/shared/types/common.types";

export type { EducationLevel } from "@/shared/types/common.types";

export type BadgeTone =
  | "gray"
  | "darkGray"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "orange";

const t = (key: string) => i18n.t(key);

export const POST_STATUS_META: Record<
  PostStatus,
  { label: string; tone: BadgeTone }
> = {
  DRAFT: {
    get label() {
      return t("post.status.DRAFT");
    },
    tone: "gray",
  },
  PUBLISHED: {
    get label() {
      return t("post.status.PUBLISHED");
    },
    tone: "green",
  },
  CLOSED: {
    get label() {
      return t("post.status.CLOSED");
    },
    tone: "orange",
  },
  REMOVED: {
    get label() {
      return t("post.status.REMOVED");
    },
    tone: "darkGray",
  },
};

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: BadgeTone }
> = {
  PENDING: {
    get label() {
      return t("application.status.PENDING");
    },
    tone: "yellow",
  },
  ACCEPTED: {
    get label() {
      return t("application.status.ACCEPTED");
    },
    tone: "green",
  },
  REJECTED: {
    get label() {
      return t("application.status.REJECTED");
    },
    tone: "red",
  },
  CANCELLED: {
    get label() {
      return t("application.status.CANCELLED");
    },
    tone: "gray",
  },
  CONFIRMED: {
    get label() {
      return t("application.status.CONFIRMED");
    },
    tone: "blue",
  },
  PAID: {
    get label() {
      return t("application.status.PAID");
    },
    tone: "blue",
  },
  FINISHED: {
    get label() {
      return t("application.status.FINISHED");
    },
    tone: "green",
  },
};

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  { label: string; tone: BadgeTone }
> = {
  PENDING: {
    get label() {
      return t("tutor.pendingNote");
    },
    tone: "yellow",
  },
  APPROVED: {
    get label() {
      return t("tutor.approvedBadge");
    },
    tone: "green",
  },
  REJECTED: {
    get label() {
      return t("tutor.rejectedNote");
    },
    tone: "red",
  },
};

export const TRANSACTION_STATUS_META: Record<
  TransactionStatus,
  { label: string; tone: BadgeTone }
> = {
  PENDING: {
    get label() {
      return t("wallet.transactionStatus.PENDING");
    },
    tone: "yellow",
  },
  SUCCESS: {
    get label() {
      return t("wallet.transactionStatus.SUCCESS");
    },
    tone: "green",
  },
  FAILED: {
    get label() {
      return t("wallet.transactionStatus.FAILED");
    },
    tone: "red",
  },
  CANCELLED: {
    get label() {
      return t("wallet.transactionStatus.CANCELLED");
    },
    tone: "gray",
  },
  REFUNDED: {
    get label() {
      return t("wallet.transactionStatus.REFUNDED");
    },
    tone: "orange",
  },
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  get TOP_UP() {
    return t("wallet.transactionType.TOP_UP");
  },
  get COMMISSION() {
    return t("wallet.transactionType.COMMISSION");
  },
  get REFUND() {
    return t("wallet.transactionType.REFUND");
  },
};

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: {
    get label() {
      return t("admin.userStatus.ACTIVE");
    },
    tone: "green",
  },
  INACTIVE: {
    get label() {
      return t("admin.userStatus.INACTIVE");
    },
    tone: "gray",
  },
  PENDING_VERIFICATION: {
    get label() {
      return t("admin.userStatus.PENDING_VERIFICATION");
    },
    tone: "yellow",
  },
  BANNED: {
    get label() {
      return t("admin.userStatus.BANNED");
    },
    tone: "red",
  },
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  get SYSTEM() {
    return t("notification.title");
  },
  get APPLICATION() {
    return t("application.title");
  },
  get PAYMENT() {
    return t("wallet.title");
  },
  get CHAT() {
    return t("chat.open");
  },
  get TRANSACTION() {
    return t("wallet.title");
  },
  get MESSAGE() {
    return t("chat.open");
  },
  get REVIEW() {
    return "Đánh giá";
  },
  get POST() {
    return "Bài đăng";
  },
  get MATCHING() {
    return t("ai.top5Title");
  },
};

export const POST_TYPE_LABEL: Record<PostType, string> = {
  get FIND_TUTOR() {
    return t("post.findTutor");
  },
  get FIND_STUDENT() {
    return t("post.findStudent");
  },
};

export const TEACHING_MODE_LABEL: Record<TeachingMode, string> = {
  get ONLINE() {
    return t("common.teachingMode.ONLINE");
  },
  get OFFLINE() {
    return t("common.teachingMode.OFFLINE");
  },
  get BOTH() {
    return t("common.teachingMode.BOTH");
  },
};

export const EDUCATION_LEVEL_LABEL: Record<EducationLevel, string> = {
  get PRIMARY() {
    return t("common.educationLevel.PRIMARY");
  },
  get SECONDARY() {
    return t("common.educationLevel.SECONDARY");
  },
  get HIGH_SCHOOL() {
    return t("common.educationLevel.HIGH_SCHOOL");
  },
  get UNIVERSITY() {
    return t("common.educationLevel.UNIVERSITY");
  },
  get OTHER() {
    return t("common.educationLevel.OTHER");
  },
};

export const BUDGET_UNIT_LABEL: Record<BudgetUnit, string> = {
  PER_HOUR: "mỗi giờ",
  PER_SESSION: "mỗi buổi",
  PER_MONTH: "mỗi tháng",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  WALLET: "Ví TutorLink",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
};

export const ACCOUNT_STATUS_META = USER_STATUS_META;

export const DAY_LABEL: Record<DayOfWeek, string> = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

export const EDUCATION_LEVELS: EducationLevel[] = [
  "PRIMARY",
  "SECONDARY",
  "HIGH_SCHOOL",
  "UNIVERSITY",
  "OTHER",
];
export const TEACHING_MODES: TeachingMode[] = ["ONLINE", "OFFLINE", "BOTH"];

export const PAYMENT_WINDOW_HOURS = 24;
