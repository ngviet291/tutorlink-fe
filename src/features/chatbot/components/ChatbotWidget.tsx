import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  ChevronLeft,
  History,
  MessageSquarePlus,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/components/ui/Spinner";
import { useTranslation } from "react-i18next";
import { useChatbot } from "../hooks/useChatbot";
import type { ChatbotPost } from "../types/chatbot.types";

const unitLabel = (
  unit: string | null | undefined,
  t: (key: string) => string,
): string | null => {
  const key = unit?.toUpperCase() ?? "";
  const matchedUnit = ["HOUR", "SESSION", "DAY", "WEEK", "MONTH"].find((item) =>
    key.includes(item),
  );
  return matchedUnit ? t(`common.units.${matchedUnit}`) : null;
};

const formatMoney = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function formatBudget(
  post: ChatbotPost,
  t: (key: string) => string,
): string | null {
  const { minBudget, maxBudget, budgetUnit } = post;
  const range =
    minBudget && maxBudget && minBudget !== maxBudget
      ? `${formatMoney(minBudget)} – ${formatMoney(maxBudget)}`
      : minBudget || maxBudget
        ? formatMoney((minBudget ?? maxBudget) as number)
        : null;
  if (!range) return null;
  const unit = unitLabel(budgetUnit, t);
  return unit ? `${range}/${unit}` : range;
}

function PostCard({ post }: { post: ChatbotPost }) {
  const { t } = useTranslation();
  const budget = formatBudget(post, t);
  return (
    <Link
      to={ROUTES.POST_DETAIL(post.id)}
      className="flex w-full max-w-[85%] gap-2.5 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-surface-secondary"
    >
      {post.authorAvatarUrl ? (
        <img
          src={post.authorAvatarUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {post.authorName.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-text-secondary">
          {post.authorName}
        </span>
        <span className="line-clamp-2 text-sm font-semibold text-text">
          {post.title}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-text-secondary">
          <span className="font-medium text-primary">{post.subjectName}</span>
          {budget && <span>{budget}</span>}
        </span>
        {post.location && (
          <span className="block truncate text-xs text-text-secondary">
            {post.location}
          </span>
        )}
      </span>
    </Link>
  );
}

interface ConfirmClearProps {
  isClearing: boolean;
  failed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmClear({
  isClearing,
  failed,
  onCancel,
  onConfirm,
}: ConfirmClearProps) {
  const { t } = useTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !isClearing) onCancel();
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="chatbot-clear-title"
      aria-describedby="chatbot-clear-desc"
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full rounded-xl border border-border bg-surface p-4 shadow-xl">
        <h3 id="chatbot-clear-title" className="text-sm font-bold text-text">
          {t("chatbot.clear.title", { defaultValue: "Xóa cuộc trò chuyện?" })}
        </h3>
        <p id="chatbot-clear-desc" className="mt-1 text-sm text-text-secondary">
          {t("chatbot.clear.message", {
            defaultValue:
              "Toàn bộ tin nhắn trong cuộc trò chuyện này sẽ bị xóa và không thể khôi phục.",
          })}
        </p>
        {failed && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {t("chatbot.clear.error", {
              defaultValue: "Không xóa được cuộc trò chuyện. Vui lòng thử lại.",
            })}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isClearing}
            className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearing && <Spinner size="sm" />}Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatbotWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearFailed, setClearFailed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    messages,
    send,
    clear,
    isSending,
    isClearing,
    conversations,
    refreshConversations,
    loadConversation,
    newConversation,
    isLoadingHistory,
    historyError,
    canViewHistory,
  } = useChatbot();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasConversation = messages.length > 1;

  useEffect(() => {
    if (open && !historyOpen)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, open, historyOpen]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, open]);

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setHistoryOpen(false);
    }
  }, [open]);

  const submit = () => {
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const askToClear = () => {
    setClearFailed(false);
    setConfirmOpen(true);
  };

  const confirmClear = async () => {
    setClearFailed(false);
    try {
      await clear();
      setConfirmOpen(false);
    } catch {
      setClearFailed(true);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    await refreshConversations();
  };

  const chooseConversation = async (id: string) => {
    const loaded = await loadConversation(id);
    if (loaded) setHistoryOpen(false);
  };

  const startNewConversation = () => {
    newConversation();
    setHistoryOpen(false);
    setDraft("");
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý TutorLink"
          className="relative flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border bg-primary px-4 py-3 text-white">
            {historyOpen ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Quay lại trò chuyện"
                className="cursor-pointer rounded p-1 hover:bg-white/20"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : (
              <Bot className="size-5" />
            )}
            <h2 className="flex-1 text-sm font-bold">
              {historyOpen ? "Lịch sử trò chuyện" : "Trợ lý TutorLink"}
            </h2>
            {!historyOpen && canViewHistory && (
              <button
                type="button"
                onClick={openHistory}
                disabled={isSending || isLoadingHistory}
                aria-label="Lịch sử trò chuyện"
                title="Lịch sử trò chuyện"
                className="cursor-pointer rounded p-1 hover:bg-white/20 disabled:opacity-40"
              >
                <History className="size-4" />
              </button>
            )}
            {!historyOpen && (
              <button
                type="button"
                onClick={askToClear}
                disabled={!hasConversation || isSending || isClearing}
                aria-label={t("chatbot.clear.open", {
                  defaultValue: "Xóa cuộc trò chuyện",
                })}
                className="cursor-pointer rounded p-1 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="cursor-pointer rounded p-1 hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
          </header>

          {historyOpen ? (
            <div className="flex flex-1 flex-col overflow-y-auto p-3">
              <button
                type="button"
                onClick={startNewConversation}
                disabled={isSending}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <MessageSquarePlus className="size-4" /> Cuộc trò chuyện mới
              </button>
              {isLoadingHistory ? (
                <div className="flex flex-1 items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : historyError ? (
                <div
                  className="py-4 text-center text-sm text-red-600"
                  role="alert"
                >
                  {historyError}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm text-text-secondary">
                  Bạn chưa có cuộc trò chuyện nào được lưu.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => chooseConversation(conversation.id)}
                      disabled={isLoadingHistory || isSending}
                      className="flex flex-col items-start gap-1 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-surface-secondary disabled:opacity-50"
                    >
                      <span className="w-full truncate text-sm font-semibold text-text">
                        {conversation.title || "Cuộc trò chuyện"}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {conversation.lastMessageAt
                          ? new Date(conversation.lastMessageAt).toLocaleString(
                              "vi-VN",
                            )
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
                aria-live="polite"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col gap-2",
                      m.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-white"
                          : m.isError
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                            : "bg-surface-secondary text-text",
                      )}
                    >
                      {m.content}
                    </div>
                    {m.posts?.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                ))}
                {isSending && (
                  <div className="self-start rounded-2xl bg-surface-secondary px-3 py-2">
                    <Spinner size="sm" />
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={onSubmit}
                className="flex items-end gap-2 border-t border-border p-2"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Nhập câu hỏi..."
                  aria-label="Nội dung tin nhắn"
                  maxLength={1000}
                  className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-6 text-text outline-none focus:border-primary"
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
            </>
          )}

          {confirmOpen && (
            <ConfirmClear
              isClearing={isClearing}
              failed={clearFailed}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={confirmClear}
            />
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng trợ lý" : "Mở trợ lý TutorLink"}
        aria-expanded={open}
        className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}
