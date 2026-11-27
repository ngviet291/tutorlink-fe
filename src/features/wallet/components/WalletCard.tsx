import { Plus, Wallet, ArrowDownToLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { formatVnd } from "@/shared/utils/currency";
import { useWallet } from "../hooks/useWallet";

const MIN_WITHDRAW_BALANCE = 10000;

export function WalletCard({
  onTopUp,
  onWithdraw,
}: {
  onTopUp: () => void;
  onWithdraw: () => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useWallet();

  return (
    <section className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
        <Wallet className="size-5" /> {t("wallet.balance")}
      </div>
      <div className="mt-2 min-h-12">
        {isLoading ? (
          <Skeleton className="h-10 w-48 bg-white/30" />
        ) : isError ? (
          <button
            type="button"
            onClick={() => void refetch()}
            className="cursor-pointer text-sm underline"
          >
            {t("wallet.loadError")}
          </button>
        ) : (
          <p className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatVnd(data?.balance ?? 0)}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={onTopUp}
          className="bg-white text-primary hover:bg-white/90"
        >
          <Plus className="size-4" /> {t("wallet.topUp")}
        </Button>
        <Button
          variant="secondary"
          onClick={onWithdraw}
          className="bg-white/10 text-white hover:bg-white/20"
          disabled={!data || data.balance < MIN_WITHDRAW_BALANCE}
        >
          <ArrowDownToLine className="size-4" />{" "}
          {t("wallet.walletCard.withdraw")}
        </Button>
      </div>
      {data && data.balance < MIN_WITHDRAW_BALANCE && (
        <p className="mt-3 text-sm text-white/90">
          {t("wallet.walletCard.minBalanceHint", {
            amount: formatVnd(MIN_WITHDRAW_BALANCE),
          })}
        </p>
      )}
    </section>
  );
}
