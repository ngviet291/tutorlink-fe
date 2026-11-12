export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/**
 * Phong bì chung của mọi event realtime từ BE.
 * `type` là string mở: hạ tầng không biết feature nào đăng ký loại event nào.
 */
export interface RealtimeEnvelope<T = unknown> {
  type: string;
  /** ISO-8601 */
  occurredAt: string;
  data: T;
}

export interface RealtimeConnectedInfo {
  /** true nếu đây là lần kết nối lại sau khi mất kết nối (event không được replay). */
  isReconnect: boolean;
}

export type Unsubscribe = () => void;

/**
 * Parse và kiểm tra phong bì. Trả `null` nếu không phải JSON hợp lệ
 * hoặc thiếu `type` / `occurredAt` / `data`.
 */
export function parseEnvelope(raw: string): RealtimeEnvelope | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { type, occurredAt, data } = value as Record<string, unknown>;
  if (typeof type !== "string" || type.length === 0) return null;
  if (typeof occurredAt !== "string") return null;
  if (data === undefined || data === null) return null;
  return { type, occurredAt, data };
}
