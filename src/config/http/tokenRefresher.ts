import axios from "axios";
import { unauthorizedEvent } from "@/config/events/emitter";
import type { ITokenStorage } from "../storage/types";

export const REFRESH_PATH = "/v1/auth/refresh-token";
const EXPIRY_SKEW_SECONDS = 30;

export interface ITokenRefresher {
  /** Làm mới token. Nhiều lời gọi đồng thời dùng chung một request. Ném lỗi nếu thất bại. */
  refresh(): Promise<string>;
  /**
   * Trả access token còn hạn (tự refresh nếu sắp hết hạn).
   * `null` nếu chưa đăng nhập hoặc phiên đã bị server từ chối (khi đó token bị xóa và phát `unauthorizedEvent`).
   */
  getValidAccessToken(): Promise<string | null>;
}

/** Đọc `exp` (giây) từ JWT mà không cần thư viện. `null` nếu không đọc được. */
export function readJwtExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function createTokenRefresher(
  baseURL: string,
  tokens: ITokenStorage,
  now: () => number = Date.now,
): ITokenRefresher {
  // Nhiều request cùng 401 thì chỉ refresh một lần, các request còn lại chờ chung
  let refreshing: Promise<string> | null = null;

  async function requestRefresh(): Promise<string> {
    const refreshToken = await tokens.getRefreshToken();
    if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

    // Dùng axios thuần (không qua interceptor) để tránh vòng lặp 401
    const res = await axios.post(
      `${baseURL}${REFRESH_PATH}`,
      { refreshToken },
      { timeout: 15000 },
    );

    const data = res.data?.data ?? res.data; // ApiResponse<T> => { code, message, data }
    await tokens.saveAccessToken(data.accessToken);
    if (data.refreshToken) await tokens.saveRefreshToken(data.refreshToken);
    return data.accessToken as string;
  }

  function refresh(): Promise<string> {
    refreshing ??= requestRefresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function getValidAccessToken(): Promise<string | null> {
    const token = await tokens.getAccessToken();
    if (!token) return null;

    const exp = readJwtExpiry(token);
    const expiring = exp !== null && exp * 1000 - now() <= EXPIRY_SKEW_SECONDS * 1000;
    if (!expiring) return token;

    try {
      return await refresh();
    } catch (error) {
      const rejectedByServer =
        !axios.isAxiosError(error) || error.response !== undefined;
      if (rejectedByServer) {
        // Phiên không còn hợp lệ: cùng cách xử lý với luồng HTTP
        await tokens.clear();
        unauthorizedEvent.emit();
        return null;
      }
      // Lỗi mạng tạm thời: giữ phiên, để lần reconnect sau thử lại
      return token;
    }
  }

  return { refresh, getValidAccessToken };
}
