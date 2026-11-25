import {
  DEFAULT_FEE_PERCENT,
  DEFAULT_FIXED_FEE,
  PERCENT_SCALE,
} from "@/features/wallet/constants/payment.constants";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { formatDate } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/errors";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminPaymentMutations,
  useFeeRates,
} from "@/features/admin/hooks/useAdminPayments";
import type { FeeRatePayload } from "@/features/admin/types/admin.types";
type FeeRate = NonNullable<ReturnType<typeof useFeeRates>["data"]>[number];

function getFeeStatus(fee: FeeRate, now = Date.now()) {
  const from = new Date(fee.effectiveFrom).getTime();
  const to = fee.effectiveTo ? new Date(fee.effectiveTo).getTime() : null;
  if (now < from) return "UPCOMING";
  if (to !== null && now >= to) return "EXPIRED";
  return "ACTIVE";
}

// labelKey được dịch lúc hiển thị để đổi ngôn ngữ vẫn đúng
const FEE_STATUS = {
  ACTIVE: { tone: "green", labelKey: "adminFee.status.ACTIVE" },
  UPCOMING: { tone: "gray", labelKey: "adminFee.status.UPCOMING" },
  EXPIRED: { tone: "gray", labelKey: "adminFee.status.EXPIRED" },
} as const;
export default function AdminFeePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useFeeRates();
  const { createFeeRate } = useAdminPaymentMutations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeRatePayload>({
    defaultValues: {
      ratePercent: DEFAULT_FEE_PERCENT,
      fixedFee: DEFAULT_FIXED_FEE,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  });

  // Message validate là khóa i18n, dịch lúc hiển thị
  const err = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit((v) =>
    createFeeRate.mutate(
      {
        ratePercent: Number(v.ratePercent),
        fixedFee: Number(v.fixedFee) || 0,
        effectiveFrom: v.effectiveFrom,
      },
      {
        onSuccess: () => {
          toast.success(t("adminFee.savedToast"));
          reset();
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    ),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title={t("adminFee.title")} />
      <form
        onSubmit={(e) => void submit(e)}
        noValidate
        className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-start"
      >
        <Input
          label={t("adminFee.ratePercent")}
          type="number"
          step="0.5"
          required
          error={err(errors.ratePercent?.message)}
          {...register("ratePercent", {
            valueAsNumber: true,
            required: "adminFee.required",
            min: { value: 0, message: "adminFee.min" },
            max: { value: PERCENT_SCALE, message: "adminFee.max" },
          })}
        />
        <Input
          label={t("adminFee.effectiveDate")}
          type="date"
          required
          error={err(errors.effectiveFrom?.message)}
          {...register("effectiveFrom", { required: "adminFee.required" })}
        />
        <Button
          type="submit"
          className="sm:mt-6"
          loading={createFeeRate.isPending}
        >
          {t("adminFee.save")}
        </Button>
      </form>
      <p className="flex items-start gap-2 text-xs text-text-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />{" "}
        {t("adminFee.note")}
      </p>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text">
          {t("adminFee.history")}
        </h2>
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">{t("adminFee.colRate")}</th>
                  <th>{t("adminFee.colFrom")}</th>
                  <th>{t("adminFee.colTo")}</th>
                  <th>{t("adminFee.colCreatedBy")}</th>
                  <th className="pr-3">{t("adminFee.colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.map((f) => (
                  <tr key={f.id}>
                    <td className="p-3 text-base font-extrabold text-primary">
                      {Number((f.rate * PERCENT_SCALE).toFixed(1))}%
                    </td>
                    <td>{formatDate(f.effectiveFrom)}</td>
                    <td>{f.effectiveTo ? formatDate(f.effectiveTo) : "—"}</td>
                    <td>{f.createdByName ?? f.createdBy}</td>
                    <td className="pr-3">
                      <td className="pr-3">
                        <Badge tone={FEE_STATUS[getFeeStatus(f)].tone}>
                          {t(FEE_STATUS[getFeeStatus(f)].labelKey)}
                        </Badge>
                      </td>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
