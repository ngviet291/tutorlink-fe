import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { forbiddenEvent, unauthorizedEvent } from "@/config/events/emitter";
import type { ITokenStorage } from "../storage/types";
import { toApiError } from "./apiError";

import { REFRESH_PATH, createTokenRefresher, type ITokenRefresher } from "./tokenRefresher";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Axios cho endpoint cần đăng nhập: gắn Bearer token, tự refresh khi 401. */
export function createPrivateClient(
  baseURL: string,
  tokens: ITokenStorage,
  refresher: ITokenRefresher = createTokenRefresher(baseURL, tokens),
): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15000 });

  client.interceptors.request.use(async (config) => {
    const token = await tokens.getAccessToken();

    console.log("[API]", config.method?.toUpperCase(), config.url);
    console.log("[JWT]", token ? "Token exists" : "Token missing");
    console.log(
      "[BODY]",
      config.data ? JSON.stringify(config.data) : "No body",
    );
    console.log(
      "[TIME]",
      new Date().toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    );

    console.log("================================");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => {
      if (
        res.data &&
        typeof res.data === "object" &&
        "code" in res.data &&
        "data" in res.data &&
        "message" in res.data
      ) {
        res.data = res.data.data;
      }

      return res;
    },
    async (error) => {
      const status = error.response?.status;
      const original = error.config as RetryableConfig | undefined;

      if (status === 403) forbiddenEvent.emit();

      const canRefresh =
        status === 401 &&
        original &&
        !original._retry &&
        !original.url?.includes(REFRESH_PATH);

      if (canRefresh) {
        original._retry = true;
        try {
          const newToken = await refresher.refresh();
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original); // gọi lại request cũ
        } catch (e) {
          console.log("REFRESH FAILED:", e);
          await tokens.clear();
          unauthorizedEvent.emit();
          return Promise.reject(toApiError(error));
        }
      }

      if (status === 401) {
        await tokens.clear();
        unauthorizedEvent.emit();
      }
      return Promise.reject(toApiError(error));
    },
  );

  return client;
}
