import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  FileText,
  RotateCw,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatDateTime } from "@/shared/utils/date";
import type { ChatMessage, MediaPayload } from "../types/chat.types";

interface Props {
  message: ChatMessage;
  mine: boolean;
  /** Hiện "Đã xem" dưới tin của tôi gần nhất mà đối phương đã đọc. */
  showReadReceipt: boolean;
  onResend: (message: ChatMessage) => void;
}

function MessageMedia({
  media,
  dimmed,
}: {
  media: MediaPayload;
  dimmed: boolean;
}) {
  const common = cn("rounded-xl", dimmed && "opacity-60");
  switch (media.mediaType) {
    case "IMAGE":
      return (
        <a href={media.url} target="_blank" rel="noreferrer">
          <img
            src={media.url}
            alt="Ảnh đính kèm"
            loading="lazy"
            className={cn(common, "max-h-64 min-h-32 max-w-full object-cover")}
          />
        </a>
      );
    case "VIDEO":
      return (
        <video
          src={media.url}
          controls
          preload="metadata"
          className={cn(common, "max-h-64 max-w-full")}
        />
      );
    case "AUDIO":
      return (
        <audio src={media.url} controls className={cn(common, "max-w-full")} />
      );
    default:
      return (
        <a
          href={media.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            common,
            "inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-sm text-text hover:underline",
          )}>
          <FileText className="size-4" aria-hidden="true" /> Tệp đính kèm
        </a>
      );
  }
}

export function MessageBubble({
  message,
  mine,
  showReadReceipt,
  onResend,
}: Props) {
  const failed = message.status === "failed";
  const sending = message.status === "sending";
  const mediaList = message.media ?? [];

  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col gap-1",
        mine ? "items-end self-end" : "items-start self-start",
      )}>
      {mediaList.map((m) => (
        <MessageMedia key={m.publicId} media={m} dimmed={sending} />
      ))}
      {message.content && (
        <p
          className={cn(
            "whitespace-pre-wrap wrap-break-word rounded-2xl px-3.5 py-2 text-sm",
            mine
              ? "rounded-br-md bg-primary text-white"
              : "rounded-bl-md border border-border bg-surface text-text",
            sending && "opacity-60",
            failed && "bg-red-500",
          )}>
          {message.content}
        </p>
      )}
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
        {failed ? (
          <>
            <AlertCircle className="size-3 text-red-500" aria-hidden="true" />
            <span className="text-red-500">Gửi thất bại</span>
            <button
              type="button"
              onClick={() => onResend(message)}
              className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
              <RotateCw className="size-3" aria-hidden="true" /> Gửi lại
            </button>
          </>
        ) : (
          <>
            <span>
              {sending ? "Đang gửi..." : formatDateTime(message.sentAt)}
            </span>
            {mine && sending && <Clock className="size-3" aria-hidden="true" />}
            {mine && message.status === "sent" && (
              <Check className="size-3" aria-hidden="true" />
            )}
            {mine && showReadReceipt && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                <CheckCheck className="size-3" aria-hidden="true" /> Đã xem
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
