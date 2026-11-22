import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { formatVnd } from "@/shared/utils/currency";
import {
  useTopUp,
  useTopUpStatus,
  useDemoTopUpConfirmation,
} from "../hooks/useWallet";
import {
  TOP_UP_PENDING_TIMEOUT_MS,
  DEMO_ORDER_PREFIX,
} from "../constants/payment.constants";
import type { TopUpResponse } from "../types/wallet.types";
import {
  VIETQR_SIMULATE_DELAY_MS,
  isVietQrSimulationEnabled,
  simulateVietQrPayment,
} from "../api/vietqr.simulator";
import { TopUpAmountStep } from "./TopUpAmountStep";
import { TopUpPaymentStep } from "./TopUpPaymentStep";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Điều phối hai bước nạp ví: chọn số tiền rồi thanh toán và theo dõi kết quả. */
export function TopUpModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const topUp = useTopUp();
  const demoConfirm = useDemoTopUpConfirmation();
  const [expired, setExpired] = useState(false);
  const [session, setSession] = useState<TopUpResponse | null>(null);

  const sessionId = session?.transaction.id;
  const orderId = session?.transaction.providerOrderId;
  const sessionAmount = session?.transaction.amount;
  const isVietQr = session?.transaction.paymentMethod === "VIETQR";
  // Nhận diện đơn giả lập từ backend; quyền xác nhận vẫn do backend kiểm tra.
  const isDemo = orderId?.startsWith(DEMO_ORDER_PREFIX) === true;

  const status = useTopUpStatus(sessionId, open && !expired);
  const finalStatus =
    status.data?.transactionStatus ?? session?.transaction.transactionStatus;

  useEffect(() => {
    if (finalStatus === "SUCCESS" && sessionAmount != null) {
      toast.success(
        t("wallet.topUpSuccess", { amount: formatVnd(sessionAmount) }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStatus]);

  // Ngừng tự kiểm tra nếu giao dịch vẫn PENDING quá lâu; người dùng có thể bấm kiểm tra lại.
  useEffect(() => {
    if (!sessionId || expired || finalStatus !== "PENDING") return;
    const timer = setTimeout(() => setExpired(true), TOP_UP_PENDING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [sessionId, finalStatus, expired]);

  // DEV: sau 3 giây tự giả lập VietQR báo tiền về (token_generate -> transaction-sync).
  useEffect(() => {
    if (
      !isVietQrSimulationEnabled ||
      !isVietQr ||
      isDemo ||
      !sessionId ||
      !orderId ||
      sessionAmount == null
    ) {
      return;
    }
    const timer = setTimeout(() => {
      simulateVietQrPayment({ orderId, amount: sessionAmount })
        .then(() => status.refetch())
        .catch((e) => toast.error(getErrorMessage(e)));
    }, VIETQR_SIMULATE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId, sessionAmount, isVietQr, isDemo]);

  const copy = (value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success("Đã sao chép"))
      .catch(() => toast.error("Không sao chép được"));
  };

  const close = () => {
    setExpired(false);
    setSession(null);
    onClose();
  };

  const recheck = () => {
    setExpired(false);
    void status.refetch();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title={session ? "Thanh toán nạp ví" : t("wallet.topUpTitle")}>
      {session ? (
        <TopUpPaymentStep
          session={session}
          isDemo={isDemo}
          done={finalStatus === "SUCCESS"}
          failed={finalStatus === "FAILED" || finalStatus === "CANCELLED"}
          expired={expired}
          statusError={status.isError ? getErrorMessage(status.error) : null}
          demoLoading={demoConfirm.isPending}
          onDemoConfirm={() =>
            demoConfirm.mutate(session.transaction.id, {
              onError: (error) => toast.error(getErrorMessage(error)),
            })
          }
          onRecheck={recheck}
          onCopy={copy}
          onClose={close}
        />
      ) : (
        <TopUpAmountStep
          loading={topUp.isPending}
          onSubmit={(payload) =>
            topUp.mutate(payload, {
              onSuccess: setSession,
              onError: (e) => toast.error(getErrorMessage(e)),
            })
          }
        />
      )}
    </Modal>
  );
}
