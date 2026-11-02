import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, RotateCcw, Send, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useChatbot } from '../hooks/useChatbot'

/** Nút chat nổi ở góc phải dưới + khung hội thoại. Gắn trong layout (PublicLayout / AppLayout). */
export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const { messages, send, reset, isSending } = useChatbot()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending, open])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
    setDraft('')
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý TutorLink"
          className="flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border bg-primary px-4 py-3 text-white">
            <Bot className="size-5" />
            <h2 className="flex-1 text-sm font-bold">Trợ lý TutorLink</h2>
            <button type="button" onClick={reset} aria-label="Bắt đầu cuộc trò chuyện mới" className="cursor-pointer rounded p-1 hover:bg-white/20">
              <RotateCcw className="size-4" />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="cursor-pointer rounded p-1 hover:bg-white/20">
              <X className="size-4" />
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                  m.role === 'user'
                    ? 'self-end bg-primary text-white'
                    : m.isError
                      ? 'self-start bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                      : 'self-start bg-surface-secondary text-text',
                )}
              >
                {m.content}
              </div>
            ))}
            {isSending && (
              <div className="self-start rounded-2xl bg-surface-secondary px-3 py-2"><Spinner size="sm" /></div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập câu hỏi..."
              aria-label="Nội dung tin nhắn"
              maxLength={1000}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              aria-label="Gửi"
              className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-primary text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng trợ lý' : 'Mở trợ lý TutorLink'}
        aria-expanded={open}
        className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  )
}
