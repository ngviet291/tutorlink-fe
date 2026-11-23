import { CheckCircle2, Copy, ExternalLink, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/shared/components/ui/Button";
import { Spinner } from "@/shared/components/ui/Spinner";
import { formatVnd } from "@/shared/utils/currency";
import type { TopUpResponse } from "../types/wallet.types";

const VIETQR_STEPS = [
  "Mở app ngân hàng và chọn quét mã QR",
  "Quét mã và kiểm tra đúng số tiền",
  "Xác nhận chuyển, số dư tự cập nhật khi tiền về",
];

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
  const Icon = success ? CheckCircle2 : XCircle;
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span
        className={
          success
            ? "flex size-20 items-center justify-center rounded-full bg-green-600/10 text-green-600"
            : "flex size-20 items-center justify-center rounded-full bg-danger/10 text-danger"
        }>
        <Icon className="size-11" />
      </span>
      <h3 className="text-lg font-bold text-text">
        {success ? "Nạp ví thành công" : "Giao dịch không thành công"}
      </h3>
      <p className="text-sm text-text-secondary">
        {success
          ? `${formatVnd(amount)} đã được cộng vào ví của bạn.`
          : "Vui lòng thử lại hoặc chọn phương thức khác."}
      </p>
      <Button fullWidth onClick={onClose}>
        Đóng
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
          Số tiền cần thanh toán
        </p>
        <p className="mt-1 text-3xl font-extrabold text-primary">
          {formatVnd(transaction.amount)}
        </p>
      </div>

      {isDemo && (
        <p
          role="status"
          className="w-full rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600">
          CHẾ ĐỘ DEMO: tiền giả lập, chỉ dùng với dữ liệu phát triển.
        </p>
      )}

      {isDemo ? (
        <Button fullWidth loading={demoLoading} onClick={onDemoConfirm}>
          Xác nhận thanh toán demo thành công
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
              alt="Mã QR VietQR"
              className="size-60 rounded-2xl border border-border bg-white object-contain p-3 shadow-sm"
            />
          ) : (
            <p className="text-sm text-danger">
              Chưa nhận được mã QR. Vui lòng đóng và thử lại.
            </p>
          )}

          {orderId && (
            <button
              type="button"
              onClick={() => onCopy(orderId)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-semibold text-text">
              Mã đơn: {orderId}
              <Copy className="size-3.5" />
            </button>
          )}

          <ol className="w-full space-y-2 rounded-xl border border-border bg-surface p-3 text-left text-sm text-text">
            {VIETQR_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <p className="w-full rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
            Chuyển đúng số tiền và không sửa nội dung. Chuyển sai số tiền sẽ cần
            đối soát thủ công.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          <p className="text-sm text-text-secondary">
            {session.paymentLink
              ? "Bấm nút bên dưới để mở trang thanh toán. Số dư sẽ cập nhật tự động sau khi hoàn tất."
              : "Chưa nhận được liên kết thanh toán. Vui lòng đóng và thử lại."}
          </p>
          {session.paymentLink && (
            <a
              href={session.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="w-full">
              <Button fullWidth>
                <ExternalLink className="size-4" /> Mở trang thanh toán
              </Button>
            </a>
          )}
        </div>
      )}

      {expired ? (
        <div role="alert" className="flex w-full flex-col items-center gap-2">
          <p className="text-sm text-amber-600">
            Chưa nhận được thanh toán. Nếu bạn đã chuyển tiền, hãy kiểm tra lại
            sau ít phút.
          </p>
          <Button variant="outline" fullWidth onClick={onRecheck}>
            Kiểm tra lại
          </Button>
        </div>
      ) : statusError ? (
        <div role="alert" className="flex w-full flex-col items-center gap-2">
          <p className="text-sm text-danger">{statusError}</p>
          <Button variant="outline" fullWidth onClick={onRecheck}>
            Kiểm tra lại
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <Spinner size="sm" /> Đang chờ xác nhận thanh toán…
        </p>
      )}

      <Button variant="ghost" onClick={onClose}>
        Để sau
      </Button>
    </div>
  );
}
