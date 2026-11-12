import type {
  RealtimeConnectedInfo,
  RealtimeEnvelope,
  RealtimeStatus,
  Unsubscribe,
} from "./realtime.types";

/** Cổng kết nối realtime. Không biết gì về React, Redux hay feature nào. */
export interface IRealtimeClient {
  /** Idempotent: gọi khi đã/đang kết nối thì không tạo thêm kết nối. */
  connect(): void;
  disconnect(): Promise<void>;
  onEvent(listener: (envelope: RealtimeEnvelope) => void): Unsubscribe;
  onStatus(listener: (status: RealtimeStatus) => void): Unsubscribe;
  /** Gọi sau mỗi lần (re)connect thành công, sau khi đã subscribe xong. */
  onConnected(listener: (info: RealtimeConnectedInfo) => void): Unsubscribe;
  getStatus(): RealtimeStatus;
}
