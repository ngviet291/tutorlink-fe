import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { useUploadMedia } from "../hooks/useChat";
import type { MediaPayload, SendMessageInput } from "../types/chat.types";

interface Props {
  channelId: string;
  onSend: (input: SendMessageInput) => void;
}

export function MessageComposer({ channelId, onSend }: Props) {
  const { t } = useTranslation();

  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia(channelId);

  // Xem trước cục bộ, chưa upload. Nhớ giải phóng URL tạm.
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canSend =
    !upload.isPending && (value.trim().length > 0 || file !== null);

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";

    if (!picked) return;

    setUploadError(null);
    setFile(picked);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canSend) return;

    setUploadError(null);

    let media: MediaPayload | undefined;

    if (file) {
      try {
        media = await upload.mutateAsync(file);
      } catch {
        setUploadError(t("chat.messageComposer.uploadFailed"));
        return;
      }
    }

    onSend({
      content: value.trim(),
      media,
    });

    setValue("");
    setFile(null);
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="border-t border-border p-3"
    >
      {(file || uploadError) && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          {file && (
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t("chat.messageComposer.attachedImage")}
                  className={`size-20 rounded-lg object-cover ${
                    upload.isPending ? "opacity-50" : ""
                  }`}
                />
              ) : (
                <span className="inline-block max-w-48 truncate rounded-lg border border-border px-3 py-2">
                  {file.name}
                </span>
              )}

              {upload.isPending && (
                <Loader2 className="absolute inset-0 m-auto size-5 animate-spin" />
              )}

              {!upload.isPending && (
                <button
                  type="button"
                  aria-label={t("chat.messageComposer.removeAttachment")}
                  onClick={() => setFile(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-surface p-0.5 shadow ring-1 ring-border"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {uploadError && (
            <span className="text-danger-text">{uploadError}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" hidden onChange={pickFile} />

        <button
          type="button"
          aria-label={t("chat.messageComposer.attachFile")}
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background disabled:opacity-50"
        >
          <Paperclip className="size-5" />
        </button>

        <input
          aria-label={t("chat.messageComposer.messageContent")}
          placeholder={t("chat.messageComposer.placeholder")}
          autoComplete="off"
          value={value}
          disabled={upload.isPending}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm text-text focus:border-primary focus:outline-2 focus:outline-primary/30"
        />

        <Button
          type="submit"
          disabled={!canSend}
          aria-label={t("chat.messageComposer.send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}
