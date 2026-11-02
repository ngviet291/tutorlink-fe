type Listener = () => void

const listeners = new Set<Listener>()

/** Kênh thông báo "phiên đã hết hạn" — tầng HTTP phát, tầng state (Redux) lắng nghe. */
export const sessionEvents = {
  onExpired(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emitExpired(): void {
    listeners.forEach((l) => l())
  },
}
