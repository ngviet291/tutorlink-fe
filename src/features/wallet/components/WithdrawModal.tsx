import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { BankSelect } from "./BankSelect";
import { useWalletMutations } from "../hooks/useWallet";
import { formatVnd } from "@/shared/utils/currency";

const MIN_WITHDRAW = 10_000;
const MAX_WITHDRAW = 50_000_000;

interface WithdrawFormData {
  amount: string;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  confirmInformation: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function WithdrawModal({ open, onClose, currentBalance }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { withdraw } = useWalletMutations();
  const isSubmitting = withdraw.isPending;
  const uid = useId();
  const bankId = `${uid}-bank`;
  const confirmId = `${uid}-confirm`;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WithdrawFormData>();

  const onSubmit = (data: WithdrawFormData) => {
    if (isSubmitting) return; // chặn bấm đúp
    withdraw.mutate(
      {
        amount: Number(data.amount),
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
      },
      {
        onSuccess: () => {
          toast.success(t("wallet.withdrawModal.submitted"));
          reset();
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const minText = formatVnd(MIN_WITHDRAW);
  const maxText = formatVnd(MAX_WITHDRAW);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("wallet.withdrawModal.title")}
      size="md"
      busy={isSubmitting}
    >
      <p className="mb-4 text-sm text-text-secondary">
        {t("wallet.withdrawModal.currentBalance")}{" "}
        <strong className="text-primary">{formatVnd(currentBalance)}</strong>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label={t("wallet.withdrawModal.amountLabel")}
          required
          type="number"
          inputMode="numeric"
          step={1000}
          placeholder={t("wallet.withdrawModal.amountPlaceholder", {
            min: minText,
          })}
          hint={t("wallet.withdrawModal.amountHint", {
            min: minText,
            max: maxText,
          })}
          disabled={isSubmitting}
          error={errors.amount?.message}
          {...register("amount", {
            required: t("wallet.withdrawModal.amountRequired"),
            validate: (value) => {
              const amount = Number(value);
              if (!Number.isInteger(amount))
                return t("wallet.withdrawModal.amountInteger");
              if (amount < MIN_WITHDRAW)
                return t("wallet.withdrawModal.amountMin", { min: minText });
              if (amount > MAX_WITHDRAW)
                return t("wallet.withdrawModal.amountMax", { max: maxText });
              if (amount > currentBalance)
                return t("wallet.withdrawModal.amountInsufficient");
              return true;
            },
          })}
        />

        <Input
          label={t("wallet.withdrawModal.accountNumber")}
          required
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t("wallet.withdrawModal.accountNumberPlaceholder")}
          disabled={isSubmitting}
          error={errors.bankAccountNumber?.message}
          {...register("bankAccountNumber", {
            required: t("wallet.withdrawModal.accountNumberRequired"),
            pattern: {
              value: /^\d{6,19}$/,
              message: t("wallet.withdrawModal.accountNumberFormat"),
            },
          })}
        />

        <FormField
          label={t("wallet.withdrawModal.bank")}
          htmlFor={bankId}
          required
          error={errors.bankName?.message}
        >
          <Controller
            name="bankName"
            control={control}
            rules={{ required: t("wallet.withdrawModal.bankRequired") }}
            defaultValue=""
            render={({ field }) => (
              <BankSelect
                id={bankId}
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={Boolean(errors.bankName)}
              />
            )}
          />
        </FormField>

        <Input
          label={t("wallet.withdrawModal.holder")}
          required
          type="text"
          autoComplete="off"
          placeholder={t("wallet.withdrawModal.holderPlaceholder")}
          disabled={isSubmitting}
          error={errors.accountHolderName?.message}
          {...register("accountHolderName", {
            required: t("wallet.withdrawModal.holderRequired"),
            setValueAs: (v: string) =>
              typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v,
            pattern: {
              value: /^[\p{L} ]{2,50}$/u,
              message: t("wallet.withdrawModal.holderFormat"),
            },
          })}
        />

        {/* Cảnh báo tài chính hiển thị TRƯỚC checkbox xác nhận */}
        <div
          role="note"
          className="flex gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-text"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-warning-text"
            aria-hidden="true"
          />
          <p>{t("wallet.withdrawModal.warning")}</p>
        </div>

        <div>
          <label
            htmlFor={confirmId}
            className="flex min-h-11 cursor-pointer items-start gap-2.5"
          >
            <input
              id={confirmId}
              type="checkbox"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.confirmInformation)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
              {...register("confirmInformation", {
                required: t("wallet.withdrawModal.confirmRequired"),
              })}
            />
            <span className="text-sm text-text-secondary">
              {t("wallet.withdrawModal.confirmBefore")}{" "}
              <strong className="text-text">
                {t("wallet.withdrawModal.confirmStrong")}
              </strong>
              .
            </span>
          </label>
          {errors.confirmInformation && (
            <p role="alert" className="mt-1 text-xs text-danger-text">
              {errors.confirmInformation.message}
            </p>
          )}
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("wallet.withdrawModal.submit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
