import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { IRealtimeClient } from "./IRealtimeClient";
import {
  parseEnvelope,
  type RealtimeConnectedInfo,
  type RealtimeEnvelope,
  type RealtimeStatus,
  type Unsubscribe,
} from "./realtime.types";

export const USER_EVENTS_DESTINATION = "/user/queue/events";
const DEFAULT_RECONNECT_DELAY_MS = 5000;

/** Phần tối thiểu của `@stomp/stompjs` Client mà adapter dùng (để thay bằng bản giả khi test). */
export interface StompClientLike {
  connectHeaders: Record<string, string>;
  activate(): void;
  deactivate(): Promise<void>;
  subscribe(
    destination: string,
    callback: (message: { body: string }) => void,
  ): { unsubscribe(): void };
}

export interface StompHooks {
  beforeConnect(client: StompClientLike): Promise<void>;
  onConnect(): void;
  onStompError(message: string): void;
  onWebSocketClose(): void;
}

export type StompClientFactory = (hooks: StompHooks) => StompClientLike;

export interface StompRealtimeClientOptions {
  url: string;
  /** Gọi trước MỖI lần connect/reconnect. Trả `null` nếu không có token hợp lệ. */
  getAccessToken: () => Promise<string | null>;
  reconnectDelayMs?: number;
  /** Chỉ dùng cho test. */
  clientFactory?: StompClientFactory;
}

function defaultFactory(
  url: string,
  reconnectDelay: number,
): StompClientFactory {
  return (hooks) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay,
      beforeConnect: (c) => hooks.beforeConnect(c as unknown as StompClientLike),
      onConnect: () => hooks.onConnect(),
      onStompError: (frame) =>
        hooks.onStompError(frame.headers["message"] ?? "STOMP error"),
      onWebSocketClose: () => hooks.onWebSocketClose(),
    });
    return client as unknown as StompClientLike;
  };
}

export class StompRealtimeClient implements IRealtimeClient {
  private readonly getAccessToken: () => Promise<string | null>;
  private readonly factory: StompClientFactory;

  private stomp: StompClientLike | null = null;
  private subscription: { unsubscribe(): void } | null = null;
  private status: RealtimeStatus = "disconnected";
  private connectedOnce = false;

  private readonly eventListeners = new Set<
    (envelope: RealtimeEnvelope) => void
  >();
  private readonly statusListeners = new Set<(s: RealtimeStatus) => void>();
  private readonly connectedListeners = new Set<
    (info: RealtimeConnectedInfo) => void
  >();

  constructor(options: StompRealtimeClientOptions) {
    this.getAccessToken = options.getAccessToken;
    this.factory =
      options.clientFactory ??
      defaultFactory(
        options.url,
        options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS,
      );
  }

  connect(): void {
    if (this.stomp) return; // đã/đang kết nối: không tạo thêm

    this.connectedOnce = false;
    this.setStatus("connecting");

    // Mọi callback kiểm tra `this.stomp === stomp` để bỏ qua tín hiệu từ kết nối đã bị hủy.
    const stomp: StompClientLike = this.factory({
      beforeConnect: async (client) => {
        let token: string | null = null;
        try {
          token = await this.getAccessToken();
        } catch (error) {
          console.error("[realtime] không lấy được access token", error);
        }
        if (this.stomp !== stomp) return;
        if (!token) {
          // Không có token thì reconnect cũng vô ích: dừng hẳn.
          this.stomp = null;
          this.setStatus("error");
          await client.deactivate();
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
        this.setStatus("connecting");
      },

      onConnect: () => {
        if (this.stomp !== stomp) return;
        // STOMP không tự subscribe lại sau reconnect.
        this.subscription?.unsubscribe();
        this.subscription = stomp.subscribe(USER_EVENTS_DESTINATION, (msg) =>
          this.handleMessage(stomp, msg.body),
        );
        this.setStatus("connected");
        const info: RealtimeConnectedInfo = { isReconnect: this.connectedOnce };
        this.connectedOnce = true;
        this.connectedListeners.forEach((l) => safeCall(l, info));
      },

      onStompError: (message) => {
        if (this.stomp !== stomp) return;
        console.error("[realtime] STOMP error:", message);
        this.setStatus("error");
      },

      onWebSocketClose: () => {
        if (this.stomp !== stomp) return;
        this.subscription = null;
        if (this.status !== "error") this.setStatus("disconnected");
      },
    });

    this.stomp = stomp;
    stomp.activate();
  }

  async disconnect(): Promise<void> {
    const stomp = this.stomp;
    this.stomp = null;
    this.connectedOnce = false;
    try {
      this.subscription?.unsubscribe();
    } catch {
      /* socket có thể đã đóng */
    }
    this.subscription = null;
    this.setStatus("disconnected");
    if (stomp) await stomp.deactivate();
  }

  onEvent(listener: (envelope: RealtimeEnvelope) => void): Unsubscribe {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onStatus(listener: (status: RealtimeStatus) => void): Unsubscribe {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onConnected(listener: (info: RealtimeConnectedInfo) => void): Unsubscribe {
    this.connectedListeners.add(listener);
    return () => this.connectedListeners.delete(listener);
  }

  getStatus(): RealtimeStatus {
    return this.status;
  }

  private handleMessage(source: StompClientLike, body: string): void {
    if (this.stomp !== source) return;
    const envelope = parseEnvelope(body);
    if (!envelope) {
      console.warn("[realtime] bỏ qua event sai định dạng");
      return;
    }
    this.eventListeners.forEach((l) => safeCall(l, envelope));
  }

  private setStatus(next: RealtimeStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.statusListeners.forEach((l) => safeCall(l, next));
  }
}

function safeCall<A>(fn: (arg: A) => void, arg: A): void {
  try {
    fn(arg);
  } catch (error) {
    console.error("[realtime] listener lỗi", error);
  }
}
