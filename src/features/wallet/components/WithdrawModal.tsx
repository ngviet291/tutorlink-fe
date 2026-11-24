import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
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
          toast.success(
            "Yêu cầu rút tiền đã được gửi. Vui lòng chờ Admin duyệt.",
          );
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Rút tiền về tài khoản"
      size="md"
      busy={isSubmitting}
    >
      <p className="mb-4 text-sm text-text-secondary">
        Số dư hiện tại:{" "}
        <strong className="text-primary">{formatVnd(currentBalance)}</strong>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Số tiền rút (VND)"
          required
          type="number"
          inputMode="numeric"
          step={1000}
          placeholder="Tối thiểu 10,000 VND"
          hint={`Tối thiểu ${formatVnd(MIN_WITHDRAW)}, tối đa ${formatVnd(MAX_WITHDRAW)} mỗi lần.`}
          disabled={isSubmitting}
          error={errors.amount?.message}
          {...register("amount", {
            required: "Vui lòng nhập số tiền",
            validate: (value) => {
              const amount = Number(value);
              if (!Number.isInteger(amount)) return "Số tiền phải là số nguyên";
              if (amount < MIN_WITHDRAW)
                return "Số tiền tối thiểu là 10,000 VND";
              if (amount > MAX_WITHDRAW)
                return "Số tiền tối đa mỗi lần là 50,000,000 VND";
              if (amount > currentBalance) return "Số dư không đủ để rút";
              return true;
            },
          })}
        />

        <Input
          label="Số tài khoản"
          required
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Nhập số tài khoản ngân hàng"
          disabled={isSubmitting}
          error={errors.bankAccountNumber?.message}
          {...register("bankAccountNumber", {
            required: "Vui lòng nhập số tài khoản",
            pattern: {
              value: /^\d{6,19}$/,
              message: "Số tài khoản gồm 6–19 chữ số",
            },
          })}
        />

        <FormField
          label="Ngân hàng"
          htmlFor={bankId}
          required
          error={errors.bankName?.message}
        >
          <Controller
            name="bankName"
            control={control}
            rules={{ required: "Vui lòng chọn ngân hàng" }}
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
          label="Tên chủ tài khoản"
          required
          type="text"
          autoComplete="off"
          placeholder="Tên như trên thẻ ngân hàng"
          disabled={isSubmitting}
          error={errors.accountHolderName?.message}
          {...register("accountHolderName", {
            required: "Vui lòng nhập tên chủ tài khoản",
            setValueAs: (v: string) =>
              typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v,
            pattern: {
              value: /^[\p{L} ]{2,50}$/u,
              message: "Tên chủ tài khoản chỉ gồm chữ cái, 2–50 ký tự",
            },
          })}
        />

        {/* Cảnh báo tài chính hiển thị TRƯỚC checkbox xác nhận */}
        <div
          role="note"
          className="flex gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-text"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p>
            Vui lòng kiểm tra kỹ thông tin ngân hàng trước khi gửi. Số tiền sẽ
            được trừ khỏi ví ngay lập tức. Admin sẽ xử lý và chuyển khoản trong
            vòng 1–3 ngày làm việc.
          </p>
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
                required: "Vui lòng xác nhận thông tin trước khi gửi yêu cầu",
              })}
            />
            <span className="text-sm text-text-secondary">
              Tôi xác nhận thông tin rút tiền và tài khoản ngân hàng đã nhập là{" "}
              <strong className="text-text">chính xác</strong>.
            </span>
          </label>
          {errors.confirmInformation && (
            <p role="alert" className="mt-1 text-xs text-danger">
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
            Hủy
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Gửi yêu cầu rút tiền
          </Button>
        </div>
      </form>
    </Modal>
  );
}
