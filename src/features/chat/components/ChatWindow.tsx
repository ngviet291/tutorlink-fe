import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Button } from '@/shared/components/ui/Button'
import { MaskedContact } from '@/shared/components/ui/MaskedContact'
import { cn } from '@/shared/utils/cn'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useToast } from '@/shared/hooks/useToast'
import { useSendMessage } from '../hooks/useChat'
import type { ChatRoom } from '../types/chat.types'

export function ChatWindow({ room }: { room: ChatRoom }) {
  const me = useAppSelector((s) => s.auth.user)
  const toast = useToast()
  const send = useSendMessage(room.applicationId)
  const endRef = useRef<HTMLDivElement | null>(null)
  const { register, handleSubmit, reset, watch } = useForm<{ content: string }>({ defaultValues: { content: '' } })
  const canSend = watch('content').trim().length > 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [room.messages.length])

  const submit = handleSubmit(({ content }) => {
    const text = content.trim()
    if (!text) return
    send.mutate(text, { onSuccess: () => reset(), onError: (e) => toast.error(getErrorMessage(e)) })
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <section className="flex h-[70vh] min-h-96 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar name={room.partnerName} src={room.partnerAvatarUrl} />
          <div>
            <p className="font-bold text-text">{room.partnerName}</p>
            <p className="flex items-center gap-1 text-xs text-text-secondary"><span className="size-2 rounded-full bg-online" /> Đã kết nối</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-background p-4" aria-live="polite">
          {room.messages.length === 0 && <p className="m-auto text-sm text-text-secondary">Hãy gửi lời chào đầu tiên 👋</p>}
          {room.messages.map((m) => {
            const mine = m.senderId === me?.id
            return (
              <div key={m.id} className={cn('flex max-w-[80%] flex-col', mine ? 'items-end self-end' : 'items-start self-start')}>
                <p className={cn('whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-text')}>
                  {m.content}
                </p>
                <span className="mt-0.5 text-[10px] text-text-secondary">{formatDateTime(m.createdAt)}</span>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex items-center gap-2 border-t border-border p-3">
          <input
            aria-label="Nội dung tin nhắn" placeholder="Nhập tin nhắn..." autoComplete="off"
            className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm text-text focus:border-primary focus:outline-2 focus:outline-primary/30"
            {...register('content')}
          />
          <Button type="submit" disabled={!canSend} loading={send.isPending} aria-label="Gửi"><Send className="size-4" /></Button>
        </form>
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold text-text">Thông tin liên hệ</h2>
          <MaskedContact contact={room.contact} />
        </div>
        <p className="rounded-2xl bg-primary-light p-4 text-xs text-text-secondary">
          Học phí thực tế hằng tháng do hai bên tự thỏa thuận ngoài hệ thống TutorLink.
        </p>
      </aside>
    </div>
  )
}
