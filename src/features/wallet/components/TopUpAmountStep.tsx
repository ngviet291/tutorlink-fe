import { useState } from "react";
import { QrCode, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { formatVnd } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/cn";
import { PaymentMethodLogo } from "./PaymentMethodLogo";
import {
  TOP_UP_PRESETS as PRESETS,
  TOP_UP_METHODS as METHODS,
  TOP_UP_MIN_AMOUNT as MIN,
  TOP_UP_MAX_AMOUNT as MAX,
  TOP_UP_DEFAULT_AMOUNT,
  type TopUpMethod,
} from "../constants/payment.constants";

const CUSTOM_MAX_DIGITS = 9;

const METHOD_META: Record<
  TopUpMethod,
  { icon: LucideIcon; logo: string; description: string }
> = {
  VIETQR: {
    icon: QrCode,
    logo: "/payment-logos/vietqr.png",
    description: "Quét mã QR bằng app ngân hàng",
  },
  //   MOMO: {
  //     icon: Wallet,
  //     logo: "/payment-logos/momo.png",
  //     description: "Thanh toán qua ví MoMo",
  //   },
};

interface Props {
  loading: boolean;
  onSubmit: (payload: { amount: number; paymentMethod: TopUpMethod }) => void;
}

/** Bước 1: chọn số tiền và phương thức thanh toán. */
export function TopUpAmountStep({ loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number>(TOP_UP_DEFAULT_AMOUNT);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<TopUpMethod>("VIETQR");

  const finalAmount = custom ? Number(custom) : amount;
  const valid = finalAmount >= MIN && finalAmount <= MAX;
  const showError = custom !== "" && !valid;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-primary-light px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Số tiền nạp
        </p>
        <p className="mt-1 text-3xl font-extrabold text-primary">
          {formatVnd(finalAmount)}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {t("wallet.topUpDesc")}
        </p>
      </div>

      <section aria-label="Chọn nhanh số tiền">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((p) => {
            const active = amount === p && !custom;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={cn(
                  "cursor-pointer rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-surface text-text hover:border-primary hover:text-primary",
                )}>
                {formatVnd(p)}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label
            htmlFor="topup-custom"
            className="mb-1 block text-xs font-semibold text-text-secondary">
            {t("wallet.customAmount")}
          </label>
          <div className="relative">
            <input
              id="topup-custom"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={custom ? Number(custom).toLocaleString("vi-VN") : ""}
              onChange={(e) =>
                setCustom(
                  e.target.value.replace(/\D/g, "").slice(0, CUSTOM_MAX_DIGITS),
                )
              }
              placeholder={t("wallet.customAmountPlaceholder")}
              aria-invalid={showError}
              className={cn(
                "h-11 w-full rounded-xl border bg-surface px-3 pr-10 text-sm font-semibold text-text focus:outline-none",
                showError
                  ? "border-danger"
                  : "border-border focus:border-primary",
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
              ₫
            </span>
          </div>
          {showError && (
            <p role="alert" className="mt-1 text-xs text-danger">
              Số tiền nạp từ {formatVnd(MIN)} đến {formatVnd(MAX)}
            </p>
          )}
        </div>
      </section>

      <section aria-label="Phương thức thanh toán">
        <p className="mb-2 text-xs font-semibold text-text-secondary">
          Phương thức thanh toán
        </p>
        <div className="grid gap-2" role="radiogroup">
          {METHODS.map((m) => {
            const meta = METHOD_META[m.value];
            const Icon = meta.icon;
            const active = method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary-light"
                    : "border-border bg-surface hover:border-primary",
                )}>
                <PaymentMethodLogo
                  src={meta.logo}
                  alt={m.label}
                  fallbackIcon={Icon}
                  active={active}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text">
                    {m.label}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {meta.description}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-primary" : "border-border",
                  )}>
                  {active && (
                    <span className="size-2.5 rounded-full bg-primary" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Button
        fullWidth
        loading={loading}
        disabled={!valid}
        onClick={() =>
          onSubmit({ amount: finalAmount, paymentMethod: method })
        }>
        {t("wallet.confirmTopUp")} · {formatVnd(valid ? finalAmount : 0)}
      </Button>
    </div>
  );
}
