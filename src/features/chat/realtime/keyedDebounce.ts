/** Gộp các lời gọi liên tiếp cùng `key` trong `delayMs` thành một (vd: nhiều tin đến dồn dập → một lần đánh dấu đã đọc). */
export function createKeyedDebounce(run: (key: string) => void, delayMs: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  return {
    call(key: string) {
      const existing = timers.get(key)
      if (existing) clearTimeout(existing)
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key)
          run(key)
        }, delayMs),
      )
    },
    cancel() {
      timers.forEach(clearTimeout)
      timers.clear()
    },
  }
}
