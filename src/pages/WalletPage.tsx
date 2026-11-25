import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PayFeeModal } from "@/features/wallet/components/PayFeeModal";
import { TopUpModal } from "@/features/wallet/components/TopUpModal";
import { WithdrawModal } from "@/features/wallet/components/WithdrawModal";
import { TransactionTable } from "@/features/wallet/components/TransactionTable";
import { WalletCard } from "@/features/wallet/components/WalletCard";
import { OfferList } from "@/features/application/components/OfferList";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import type { ApplicationResponse } from "@/features/application/types/application.types";

export default function WalletPage() {
  const { t } = useTranslation();
  const [topUp, setTopUp] = useState(false);
  const [withdraw, setWithdraw] = useState(false);
  const [offer, setOffer] = useState<ApplicationResponse | null>(null);
  const isTutor = useAppSelector((s) => s.auth.user?.role === "TUTOR");
  const { data: wallet } = useWallet();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={t("wallet.title")}
        description={t("wallet.description")}
      />
      <WalletCard
        onTopUp={() => setTopUp(true)}
        onWithdraw={() => setWithdraw(true)}
      />
      {isTutor && <OfferList onPay={setOffer} />}
      <TransactionTable />
      <TopUpModal open={topUp} onClose={() => setTopUp(false)} />
      <WithdrawModal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        currentBalance={wallet?.balance ?? 0}
      />
      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  );
}
