import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { getErrorMessage } from "@/shared/utils/errors";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChannel } from "@/features/chat/hooks/useChat";

export default function ChatPage() {
  const { t } = useTranslation();
  const { channelId } = useParams();
  const { data, isLoading, isError, error, refetch } = useChannel(channelId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={ROUTES.CHAT_INBOX}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t("chat.allMessages")}
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError || !data ? (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        // key: đổi kênh thì dựng lại cửa sổ, tránh giữ state cũ
        <ChatWindow key={data.channelId} channel={data} />
      )}
      <p className="mt-3 rounded-2xl bg-primary-light p-4 text-xs text-text-secondary">
        {t("chat.tuitionNotice")}
      </p>
    </div>
  );
}
