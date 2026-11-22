import { env } from "@/config/env";

/**
 * CHỈ DÙNG KHI PHÁT TRIỂN: giả lập VietQR gọi callback vào BE để đơn nạp ví hoàn tất.
 * Bật bằng VITE_VIETQR_SIMULATE=true (và chỉ chạy ở bản dev). Không bao giờ bật ở production:
 * tài khoản callback đặt trong .env của FE sẽ lộ ra trình duyệt và ai cũng tự cộng tiền được.
 */
export const VIETQR_SIMULATE_DELAY_MS = 3_000;

export const isVietQrSimulationEnabled =
  import.meta.env.DEV && import.meta.env.VITE_VIETQR_SIMULATE === "true";

interface SimulatedPayment {
  orderId: string;
  amount: number;
}

export async function simulateVietQrPayment({
  orderId,
  amount,
}: SimulatedPayment): Promise<void> {
  const username = import.meta.env.VITE_VIETQR_CALLBACK_USERNAME ?? "";
  const password = import.meta.env.VITE_VIETQR_CALLBACK_PASSWORD ?? "";
  const base = `${env.apiBaseUrl}/vqr`;

  // 1. Lấy token như VietQR: Basic auth bằng tài khoản callback của TutorLink.
  const tokenRes = await fetch(`${base}/api/token_generate`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
  });
  if (!tokenRes.ok) {
    throw new Error(`token_generate thất bại (HTTP ${tokenRes.status})`);
  }
  const { access_token: token } = (await tokenRes.json()) as {
    access_token?: string;
  };
  if (!token) throw new Error("token_generate không trả access_token");

  // 2. Báo biến động số dư (ghi có) cho đúng orderId và số tiền của đơn.
  const syncRes = await fetch(`${base}/bank/api/transaction-sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      transactionid: `SIM${Date.now()}`,
      amount,
      transType: "C",
      content: orderId,
    }),
  });
  if (!syncRes.ok) {
    throw new Error(`transaction-sync thất bại (HTTP ${syncRes.status})`);
  }
}
