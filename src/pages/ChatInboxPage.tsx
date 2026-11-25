import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { timeAgo } from "@/shared/utils/date";
import { ConnectionStatus } from "@/features/chat/components/ConnectionStatus";
import { useChannels } from "@/features/chat/hooks/useChat";

export default function ChatInboxPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useChannels();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={t("chatInbox.title")}
        description={t("chatInbox.description")}
      />
      <ConnectionStatus />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState
          message={t("chatInbox.loadFailed")}
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState
          icon={<MessageSquare className="size-10" />}
          title={t("chatInbox.emptyTitle")}
          description={t("chatInbox.emptyDescription")}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {data.map((ch) => (
            <li key={ch.channelId}>
              <Link
                to={ROUTES.CHAT(ch.channelId)}
                className="flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <Avatar
                  name={ch.partner.fullName}
                  src={ch.partner.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`truncate ${ch.unreadCount ? "font-extrabold" : "font-semibold"} text-text`}
                    >
                      {ch.partner.fullName}
                    </p>
                    {ch.lastMessageAt && (
                      <span className="shrink-0 text-xs text-text-secondary">
                        {timeAgo(ch.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-sm ${ch.unreadCount ? "font-semibold text-text" : "text-text-secondary"}`}
                  >
                    {ch.lastMessage ??
                      (ch.lastMessageAt
                        ? t("chatInbox.openToView")
                        : t("chatInbox.noMessages"))}
                  </p>
                </div>
                {ch.unreadCount > 0 && (
                  <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white">
                    <span aria-hidden="true">{ch.unreadCount}</span>
                    <span className="sr-only">
                      {t("chatInbox.unreadCount", { count: ch.unreadCount })}
                    </span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
