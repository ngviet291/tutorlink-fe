export const PAYMENT_API_PATH = "/v1/payments";
export const PAYMENT_REQUEST_TIMEOUT_MS = 45_000;
export const PAYMENT_PAGE_SIZE = 10;
export const FEE_CONFIG_PAGE_SIZE = 50;
export const PERCENT_SCALE = 100;
export const DEFAULT_FEE_PERCENT = 20;
export const DEFAULT_FIXED_FEE = 0;

export const TOP_UP_POLL_INTERVAL_MS = 3_000;
export const TOP_UP_PRESETS = [50_000, 100_000, 200_000, 500_000];
export const TOP_UP_MIN_AMOUNT = 10_000;
export const TOP_UP_MAX_AMOUNT = 50_000_000;
export const TOP_UP_DEFAULT_AMOUNT = 100_000;
export const TOP_UP_METHODS = [
  { value: "VIETQR", label: "VietQR (chuyển khoản)" },
] as const;
export type TopUpMethod = (typeof TOP_UP_METHODS)[number]["value"];
/** Quá thời gian này mà giao dịch vẫn PENDING thì FE ngừng tự kiểm tra (người dùng có thể bấm kiểm tra lại). */
export const TOP_UP_PENDING_TIMEOUT_MS = 15 * 60_000;
export const DEMO_ORDER_PREFIX = "MOCK";
