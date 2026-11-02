import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getErrorMessage } from '@/shared/utils/errors'
import { chatbotService } from '../service/chatbot.service'
import type { ChatbotMessage } from '../types/chatbot.types'

const HISTORY_LIMIT = 10

const makeMsg = (role: ChatbotMessage['role'], content: string, isError = false): ChatbotMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  isError,
})

const GREETING = 'Xin chào! Mình là trợ lý TutorLink. Bạn cần hỗ trợ gì?'

/** State + gọi API cho chatbot. Tin nhắn chỉ nằm trong bộ nhớ (reload là mất). */
export function useChatbot() {
  const [messages, setMessages] = useState<ChatbotMessage[]>(() => [makeMsg('assistant', GREETING)])
  const conversationId = useRef<string | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (text: string) =>
      chatbotService.sendMessage({
        conversationId: conversationId.current,
        message: text,
        history: messages
          .filter((m) => !m.isError)
          .slice(-HISTORY_LIMIT)
          .map(({ role, content }) => ({ role, content })),
      }),
    onSuccess: (res) => {
      if (res.conversationId) conversationId.current = res.conversationId
      setMessages((prev) => [...prev, makeMsg('assistant', res.reply)])
    },
    onError: (err) => {
      setMessages((prev) => [...prev, makeMsg('assistant', getErrorMessage(err), true)])
    },
  })

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || mutation.isPending) return
      setMessages((prev) => [...prev, makeMsg('user', text)])
      mutation.mutate(text)
    },
    [mutation],
  )

  const reset = useCallback(() => {
    conversationId.current = undefined
    setMessages([makeMsg('assistant', GREETING)])
  }, [])

  return { messages, send, reset, isSending: mutation.isPending }
}
