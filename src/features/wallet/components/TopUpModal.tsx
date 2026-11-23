import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle2, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { Spinner } from "@/shared/components/ui/Spinner";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { formatVnd } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/cn";
import {
  useTopUp,
  useTopUpStatus,
  useDemoTopUpConfirmation,
} from "../hooks/useWallet";
import {
  TOP_UP_PRESETS as PRESETS,
  TOP_UP_METHODS as METHODS,
  TOP_UP_MIN_AMOUNT as MIN,
  TOP_UP_MAX_AMOUNT as MAX,
  TOP_UP_DEFAULT_AMOUNT,
  TOP_UP_PENDING_TIMEOUT_MS,
  DEMO_ORDER_PREFIX,
  type TopUpMethod,
} from "../constants/payment.constants";
import type { TopUpResponse } from "../types/wallet.types";
import {
  VIETQR_SIMULATE_DELAY_MS,
  isVietQrSimulationEnabled,
  simulateVietQrPayment,
} from "../api/vietqr.simulator";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TopUpModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const topUp = useTopUp();
  const [amount, setAmount] = useState<number>(TOP_UP_DEFAULT_AMOUNT);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<TopUpMethod>("VIETQR");
  const [expired, setExpired] = useState(false);
  const [session, setSession] = useState<TopUpResponse | null>(null);
  // Nhận diện đơn giả lập từ backend; quyền xác nhận vẫn do backend kiểm tra.
  const isDemo =
    session?.transaction.providerOrderId?.startsWith(DEMO_ORDER_PREFIX) ===
    true;
  const demoConfirm = useDemoTopUpConfirmation();

  const finalAmount = custom ? Number(custom.replace(/\D/g, "")) : amount;
  const valid = finalAmount >= MIN && finalAmount <= MAX;

  const status = useTopUpStatus(session?.transaction.id, open && !expired);
  const finalStatus =
    status.data?.transactionStatus ?? session?.transaction.transactionStatus;

  useEffect(() => {
    if (finalStatus === "SUCCESS") {
      toast.success(
        t("wallet.topUpSuccess", { amount: formatVnd(finalAmount) }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStatus]);

  // Ngừng tự kiểm tra nếu giao dịch vẫn PENDING quá lâu; người dùng có thể bấm kiểm tra lại.
  const sessionId = session?.transaction.id;
  useEffect(() => {
    if (!sessionId || expired || finalStatus !== "PENDING") return;
    const timer = setTimeout(() => setExpired(true), TOP_UP_PENDING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [sessionId, finalStatus, expired]);

  // DEV: sau 3 giây tự giả lập VietQR báo tiền về (token_generate -> transaction-sync).
  const simulateOrderId = session?.transaction.providerOrderId;
  const simulateAmount = session?.transaction.amount;
  const simulateIsVietQr = session?.transaction.paymentMethod === "VIETQR";
  useEffect(() => {
    if (
      !isVietQrSimulationEnabled ||
      !simulateIsVietQr ||
      isDemo ||
      !sessionId ||
      !simulateOrderId ||
      simulateAmount == null
    ) {
      return;
    }
    const timer = setTimeout(() => {
      simulateVietQrPayment({
        orderId: simulateOrderId,
        amount: simulateAmount,
      })
        .then(() => status.refetch())
        .catch((e) => toast.error(getErrorMessage(e)));
    }, VIETQR_SIMULATE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, simulateOrderId, simulateAmount, simulateIsVietQr, isDemo]);
  
  const copy = (value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success("Đã sao chép"))
      .catch(() => toast.error("Không sao chép được"));
  };

  const close = () => {
    setExpired(false);
    setSession(null);
    setCustom("");
    onClose();
  };

  const create = () => {
    if (!valid) {
      toast.error(`Số tiền nạp từ ${formatVnd(MIN)} đến ${formatVnd(MAX)}`);
      return;
    }
    topUp.mutate(
      { amount: finalAmount, paymentMethod: method },
      {
        onSuccess: setSession,
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  if (session) {
    const isVietQr =
      session.transaction.paymentMethod === "VIETQR" || method === "VIETQR";
    const done = finalStatus === "SUCCESS";
    const failed = finalStatus === "FAILED" || finalStatus === "CANCELLED";
    return (
      <Modal open={open} onClose={close} title="Thanh toán nạp ví">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-2xl font-extrabold text-primary">
            {formatVnd(session.transaction.amount)}
          </p>
          {isDemo && (
            <p role="status" className="text-sm font-semibold text-amber-600">
              CHẾ ĐỘ DEMO — tiền giả lập, không thanh toán thật. Chỉ dùng
              với dữ liệu phát triển.
            </p>
          )}
          {done ? (
            <p className="flex items-center gap-2 font-semibold text-green-600">
              <CheckCircle2 className="size-5" /> Nạp ví thành công
            </p>
          ) : failed ? (
            <p className="font-semibold text-danger">
              Giao dịch không thành công. Vui lòng thử lại.
            </p>
          ) : (
            <>
              {isVietQr && !isDemo ? (
                <div className="flex flex-col items-center gap-3">
                  {session.qrCodeUrl ? (
                    <div className="rounded-xl border border-border bg-white p-3">
                      <QRCodeSVG value={session.qrCodeUrl} size={208} />
                    </div>
                  ) : session.paymentLink ? (
                    <img
                      src={session.paymentLink}
                      alt="Mã QR VietQR"
                      className="size-52 rounded-xl border border-border bg-white object-contain p-2"
                    />
                  ) : (
                    <p className="text-sm text-danger">
                      Chưa nhận được mã QR. Vui lòng đóng và thử lại.
                    </p>
                  )}
                  <p className="text-sm text-text-secondary">
                    Mở app ngân hàng, quét mã QR và chuyển đúng số tiền. Số dư
                    được cập nhật tự động khi tiền về.
                  </p>
                  {session.transaction.providerOrderId && (
                    <button
                      type="button"
                      onClick={() => copy(session.transaction.providerOrderId!)}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text">
                      Mã đơn: {session.transaction.providerOrderId}
                      <Copy className="size-3.5" />
                    </button>
                  )}
                  <p className="text-xs text-amber-600">
                    Chuyển đúng số tiền và không sửa nội dung. Chuyển sai số
                    tiền sẽ cần đối soát thủ công.
                  </p>
                </div>
              ) : isDemo ? (
                <Button
                  loading={demoConfirm.isPending}
                  onClick={() =>
                    demoConfirm.mutate(session.transaction.id, {
                      onError: (error) => toast.error(getErrorMessage(error)),
                    })
                  }>
                  Xác nhận thanh toán demo thành công
                </Button>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">
                    Hoàn tất thanh toán, số dư sẽ được cập nhật tự
                    động.
                  </p>
                                    <p className="text-sm text-text-secondary">
                    {session.paymentLink
                      ? "Bấm mở trang thanh toán để xem mã QR."
                      : "Chưa nhận được liên kết thanh toán. Vui lòng đóng và thử lại."}
                  </p>
                  {session.paymentLink && (
                    <a
                      href={session.paymentLink}
                      target="_blank"
                      rel="noreferrer">
                      <Button>
                        <ExternalLink className="size-4" /> Mở trang thanh toán
                      </Button>
                    </a>
                  )}
                </>
              )}
              {expired ? (
                <div role="alert" className="flex flex-col items-center gap-2">
                  <p className="text-sm text-amber-600">
                    Chưa nhận được thanh toán. Nếu bạn đã chuyển tiền, hãy kiểm
                    tra lại sau ít phút.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExpired(false);
                      void status.refetch();
                    }}>
                    Kiểm tra lại
                  </Button>
                </div>
              ) : status.isError ? (
                <div role="alert">
                  <p className="text-sm text-danger">
                    {getErrorMessage(status.error)}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => void status.refetch()}>
                    Kiểm tra lại
                  </Button>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-xs text-text-secondary">
                  <Spinner size="sm" /> Đang chờ xác nhận…
                </p>
              )}
            </>
          )}
          <Button
            variant={done || failed ? "primary" : "ghost"}
            onClick={close}>
            {done || failed ? "Đóng" : "Để sau"}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title={t("wallet.topUpTitle")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t("wallet.topUpDesc")}</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setAmount(p);
                setCustom("");
              }}
              className={cn(
                "cursor-pointer rounded-xl border p-3 text-sm font-semibold transition-colors",
                amount === p && !custom
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:border-primary hover:text-primary",
              )}>
              {formatVnd(p)}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            {t("wallet.customAmount")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setAmount(0);
            }}
            placeholder={t("wallet.customAmountPlaceholder")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-text-secondary">
            Phương thức thanh toán
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Phương thức thanh toán">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={method === m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-sm font-semibold transition-colors",
                  method === m.value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-text hover:border-primary",
                )}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {valid && (
          <p className="rounded-lg bg-surface-hover p-2 text-center text-sm font-bold text-primary">
            {t("wallet.willAdd", { amount: formatVnd(finalAmount) })}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button loading={topUp.isPending} onClick={create}>
            {t("wallet.confirmTopUp")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
