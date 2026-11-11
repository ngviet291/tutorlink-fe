import type { RealtimeEnvelope, Unsubscribe } from "./realtime.types";

export type RealtimeHandler<T = unknown> = (
  envelope: RealtimeEnvelope<T>,
) => void;

/** Phân phối event theo `type`. Thêm loại event mới chỉ cần `register`, không sửa router. */
export class RealtimeEventRouter {
  private readonly handlers = new Map<string, Set<RealtimeHandler>>();

  register<T = unknown>(type: string, handler: RealtimeHandler<T>): Unsubscribe {
    const set = this.handlers.get(type) ?? new Set<RealtimeHandler>();
    set.add(handler as RealtimeHandler);
    this.handlers.set(type, set);
    return () => this.unregister(type, handler);
  }

  unregister<T = unknown>(type: string, handler: RealtimeHandler<T>): void {
    const set = this.handlers.get(type);
    if (!set) return;
    set.delete(handler as RealtimeHandler);
    if (set.size === 0) this.handlers.delete(type);
  }

  /** Trả về số handler đã chạy. Lỗi của một handler không chặn các handler khác. */
  handle(envelope: RealtimeEnvelope): number {
    const set = this.handlers.get(envelope.type);
    if (!set) return 0;
    let count = 0;
    for (const handler of [...set]) {
      try {
        handler(envelope);
        count += 1;
      } catch (error) {
        console.error(`[realtime] handler "${envelope.type}" lỗi`, error);
      }
    }
    return count;
  }
}
