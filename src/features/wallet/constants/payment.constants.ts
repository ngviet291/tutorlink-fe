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
export const TOP_UP_METHODS = [{ value: "MOMO", label: "MoMo" }] as const;
export const DEMO_ORDER_PREFIX = "MOCK";
