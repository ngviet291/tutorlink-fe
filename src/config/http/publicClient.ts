import axios, { type AxiosInstance } from "axios";
import { toApiError } from "./apiError";

/** Axios cho endpoint công khai: không gắn token. */
export function createPublicClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15000,
  });

  client.interceptors.request.use((config) => {
    console.log("[API]", config.method?.toUpperCase(), config.url);

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
    (error) => Promise.reject(toApiError(error)),
  );

  return client;
}
