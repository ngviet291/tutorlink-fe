import { CheckCircle2, Copy, ExternalLink, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Spinner } from "@/shared/components/ui/Spinner";
import { formatVnd } from "@/shared/utils/currency";
import type { TopUpResponse } from "../types/wallet.types";

// Chỉ giữ khóa dịch; chữ được dịch lúc render để đổi VI/EN có hiệu lực ngay.
const VIETQR_STEP_KEYS = [
  "wallet.topUpPaymentStep.step1",
  "wallet.topUpPaymentStep.step2",
  "wallet.topUpPaymentStep.step3",
] as const;

interface Props {
  session: TopUpResponse;
  isDemo: boolean;
  done: boolean;
  failed: boolean;
  expired: boolean;
  statusError: string | null;
  demoLoading: boolean;
  onDemoConfirm: () => void;
  onRecheck: () => void;
  onCopy: (value: string) => void;
  onClose: () => void;
}

function Result({
  success,
  amount,
  onClose,
}: {
  success: boolean;
  amount: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const Icon = success ? CheckCircle2 : XCircle;
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span
        className={
          success
            ? "flex size-20 items-center justify-center rounded-full bg-success/10 text-success-text"
            : "flex size-20 items-center justify-center rounded-full bg-danger/10 text-danger-text"
        }
      >
        <Icon className="size-11" />
      </span>
      <h3 className="text-lg font-bold text-text">
        {success
          ? t("wallet.topUpModal.success")
          : t("wallet.topUpPaymentStep.failedTitle")}
      </h3>
      <p className="text-sm text-text-secondary">
        {success
          ? t("wallet.topUpPaymentStep.successDesc", {
              amount: formatVnd(amount),
            })
          : t("wallet.topUpPaymentStep.failedDesc")}
      </p>
      <Button fullWidth onClick={onClose}>
        {t("wallet.topUpModal.close")}
      </Button>
    </div>
  );
}

/** Bước 2: hiển thị QR hoặc liên kết thanh toán và theo dõi kết quả. */
export function TopUpPaymentStep({
  session,
  isDemo,
  done,
  failed,
  expired,
  statusError,
  demoLoading,
  onDemoConfirm,
  onRecheck,
  onCopy,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { transaction } = session;
  if (done || failed) {
    return (
      <Result success={done} amount={transaction.amount} onClose={onClose} />
    );
  }

  const isVietQr = transaction.paymentMethod === "VIETQR";
  const orderId = transaction.providerOrderId;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-full rounded-2xl bg-primary-light px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t("wallet.topUpPaymentStep.amountDue")}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-primary">
          {formatVnd(transaction.amount)}
        </p>
      </div>

      {isDemo && (
        <p
          role="status"
          className="w-full rounded-xl bg-warning/10 px-3 py-2 text-sm font-semibold text-warning-text"
        >
          {t("wallet.topUpPaymentStep.demoNotice")}
        </p>
      )}

      {isDemo ? (
        <Button fullWidth loading={demoLoading} onClick={onDemoConfirm}>
          {t("wallet.topUpModal.demoConfirm")}
        </Button>
      ) : isVietQr ? (
        <div className="flex w-full flex-col items-center gap-4">
          {session.qrCodeUrl ? (
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <QRCodeSVG value={session.qrCodeUrl} size={224} />
            </div>
          ) : session.paymentLink ? (
            <img
              src={session.paymentLink}
              alt={t("wallet.topUpModal.qrAlt")}
              className="size-60 rounded-2xl border border-border bg-white object-contain p-3 shadow-sm"
            />
          ) : (
            <p className="text-sm text-danger-text">
              {t("wallet.topUpModal.qrMissing")}
            </p>
          )}

          {orderId && (
            <button
              type="button"
              onClick={() => onCopy(orderId)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text"
            >
              {t("wallet.topUpModal.orderId", { id: orderId })}
              <Copy className="size-3.5" />
            </button>
          )}

          <ol className="w-full space-y-2 rounded-xl border border-border bg-surface p-3 text-left text-sm text-text">
            {VIETQR_STEP_KEYS.map((key, i) => (
              <li key={key} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>

          <p className="w-full rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning-text">
            {t("wallet.topUpModal.transferWarning")}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          <p className="text-sm text-text-secondary">
            {session.paymentLink
              ? t("wallet.topUpPaymentStep.openHint")
              : t("wallet.topUpModal.noPaymentLink")}
          </p>
          {session.paymentLink && (
            <a
              href={session.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button fullWidth>
                <ExternalLink className="size-4" />{" "}
                {t("wallet.topUpModal.openPayment")}
              </Button>
            </a>
          )}
        </div>
      )}

      {expired ? (
        <div role="alert" className="flex w-full flex-col items-center gap-2">
          <p className="text-sm text-warning-text">
            {t("wallet.topUpModal.notReceived")}
          </p>
          <Button variant="outline" fullWidth onClick={onRecheck}>
            {t("wallet.topUpModal.recheck")}
          </Button>
        </div>
      ) : statusError ? (
        <div role="alert" className="flex w-full flex-col items-center gap-2">
          <p className="text-sm text-danger-text">{statusError}</p>
          <Button variant="outline" fullWidth onClick={onRecheck}>
            {t("wallet.topUpModal.recheck")}
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <Spinner size="sm" /> {t("wallet.topUpPaymentStep.waiting")}
        </p>
      )}

      <Button variant="ghost" onClick={onClose}>
        {t("wallet.topUpModal.later")}
      </Button>
    </div>
  );
}
