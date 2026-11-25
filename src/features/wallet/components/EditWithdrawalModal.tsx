import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { useUpdateWithdrawal } from "../hooks/useWallet";
import type {
  TransactionResponse,
  WithdrawalBankDetails,
} from "../types/wallet.types";
import { BankSelect } from "./BankSelect";

interface Props {
  transaction: TransactionResponse;
  onClose: () => void;
}

export function EditWithdrawalModal({ transaction, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateWithdrawal();
  const bankId = `${useId()}-bank`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WithdrawalBankDetails>({
    defaultValues: {
      bankAccountNumber: transaction.bankAccountNumber ?? "",
      bankName: transaction.bankName ?? "",
      accountHolderName: transaction.accountHolderName ?? "",
    },
  });

  const onSubmit = (details: WithdrawalBankDetails) => {
    if (update.isPending) return;
    update.mutate(
      { id: transaction.id, details },
      {
        onSuccess: () => {
          toast.success(t("wallet.editWithdrawalModal.updated"));
          onClose();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("wallet.editWithdrawalModal.title")}
      busy={update.isPending}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label={t("wallet.editWithdrawalModal.accountNumber")}
          required
          inputMode="numeric"
          autoComplete="off"
          disabled={update.isPending}
          error={errors.bankAccountNumber?.message}
          {...register("bankAccountNumber", {
            required: t("wallet.editWithdrawalModal.accountNumberRequired"),
            pattern: {
              value: /^\d{6,19}$/,
              message: t("wallet.editWithdrawalModal.accountNumberFormat"),
            },
          })}
        />
        <FormField
          label={t("wallet.editWithdrawalModal.bank")}
          htmlFor={bankId}
          required
          error={errors.bankName?.message}
        >
          <Controller
            name="bankName"
            control={control}
            rules={{ required: t("wallet.editWithdrawalModal.bankRequired") }}
            render={({ field }) => (
              <BankSelect
                id={bankId}
                value={field.value}
                onChange={field.onChange}
                disabled={update.isPending}
                error={Boolean(errors.bankName)}
              />
            )}
          />
        </FormField>
        <Input
          label={t("wallet.editWithdrawalModal.holder")}
          required
          autoComplete="off"
          disabled={update.isPending}
          error={errors.accountHolderName?.message}
          {...register("accountHolderName", {
            required: t("wallet.editWithdrawalModal.holderRequired"),
            pattern: {
              value: /^[\p{L} ]{2,50}$/u,
              message: t("wallet.editWithdrawalModal.holderFormat"),
            },
            setValueAs: (value: string) =>
              typeof value === "string"
                ? value.trim().replace(/\s+/g, " ")
                : value,
          })}
        />
        <div className="mt-1 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            {t("common.close")}
          </Button>
          <Button type="submit" loading={update.isPending}>
            {t("wallet.editWithdrawalModal.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
