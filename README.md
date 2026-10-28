# TutorLink — Frontend

Giao diện website kết nối gia sư và học viên (React + TypeScript + Tailwind CSS v4). **Chỉ có frontend**; toàn bộ luồng chạy được bằng dữ liệu mock.

## Chạy dự án

```bash
npm install
cp .env.example .env     # đã có sẵn .env với VITE_USE_MOCK=true
npm run dev              # http://localhost:5173
npm run build            # build production
npx tsc -p tsconfig.app.json --noEmit   # kiểm tra kiểu
```

### Bật / tắt mock

| Biến | Ý nghĩa |
|---|---|
| `VITE_USE_MOCK=true` | Service trả dữ liệu giả từ `src/mocks` (không cần backend) |
| `VITE_USE_MOCK=false` | Service gọi API thật tại `VITE_API_BASE_URL` (mặc định `http://localhost:8080`) |

Dữ liệu mock nằm trong bộ nhớ: **tải lại trang sẽ reset** dữ liệu bài đăng/ví/đăng ký (chỉ phiên đăng nhập được giữ trong localStorage).

### Tài khoản demo (mật khẩu `12345678`)

| Email | Vai trò / trạng thái |
|---|---|
| `student@demo.com` | Học viên — có bài p-1 với 6 ứng viên để thử AI Top 5 |
| `tutor@demo.com` | Gia sư APPROVED — ví 300.000đ, có lời mời nhận lớp cần thanh toán (thiếu số dư → thử nạp tiền) |
| `pending.tutor@demo.com` | Gia sư chờ duyệt |
| `rejected.tutor@demo.com` | Gia sư bị từ chối (có ghi chú của Admin) |
| `admin@demo.com` | Admin |

Thử fallback AI: chạy `localStorage.setItem('tl_mock_ai_fail','1')` trong console rồi mở lại panel (nhãn “Gợi ý theo quy tắc”). Xóa bằng `localStorage.removeItem('tl_mock_ai_fail')`.

## Cấu trúc

Theo feature-based (`src/features/*`), dùng chung ở `src/shared`, route lazy trong `src/app/router.tsx`. Redux Toolkit giữ auth + toast; dữ liệu server qua React Query (query key ở `constants/queryKeys.ts`).

## Các chỗ cần nối API thật

Khi đặt `VITE_USE_MOCK=false`, mỗi service dùng `http` (bọc `axiosClient`) và **giả định response dạng `{ success, message?, data }`** (xem `shared/types/api.types.ts`).

**5 service làm đầy đủ** (endpoint dự kiến theo đặc tả):
`auth.service.ts`, `post.service.ts`, `application.service.ts`, `wallet.service.ts`, và `config/axiosClient.ts` (gắn Bearer, refresh token khi 401 có hàng đợi, đăng xuất khi refresh thất bại).

**Các service còn lại — endpoint chỉ là phỏng đoán, đánh dấu `// TODO: nối API`:**
`tutor`, `user`, `favorite`, `subject`, `review`, `notification`, `chat`, `admin`. Ngoài ra trong `application.service` (`getConnections`, `cancelApplication`) và `wallet.service` (`confirmTopUp`, `getFeeQuote`).

## Giả định đã đặt

- **Ai trả phí:** luôn là gia sư. Bài `FIND_TUTOR` → gia sư ứng tuyển trả; bài `FIND_STUDENT` → gia sư đăng bài trả khi chọn học viên.
- **Học phí tính phí** = trung bình (min, max) ngân sách bài đăng, làm tròn 1.000đ. Tỉ lệ lấy từ cấu hình Admin (mặc định 20%).
- **Hạn thanh toán:** 24 giờ sau khi được chọn (`PAYMENT_WINDOW_HOURS`). Quá hạn hoặc từ chối → lượt `CANCELLED`, các lượt bị `REJECTED` do lần chọn đó được trả về `PENDING` để người đăng bài chọn lại.
- **Nạp tiền:** modal hiển thị thông tin chuyển khoản + QR minh họa; nút “Tôi đã chuyển khoản” chỉ giả lập ngân hàng xác nhận (thực tế do backend/webhook). Ví không có chức năng rút tiền.
- **“Lớp kết thúc”:** không có trạng thái riêng; học viên có nút “Kết thúc lớp & đánh giá” trên các lớp đã kết nối. Mỗi lớp một đánh giá.
- **Gia sư đã APPROVED chỉnh sửa hồ sơ** giữ nguyên trạng thái; hồ sơ PENDING/REJECTED gửi lại sẽ về PENDING.
- **Bảo mật hiển thị:** liên hệ thật chỉ được trả/hiển thị khi lượt đăng ký đã thanh toán và người xem là một trong hai bên; mọi nơi khác là `09xx xxx xxx` kèm biểu tượng khóa. Guest chỉ thấy bài `PUBLISHED` và hồ sơ gia sư `APPROVED`.
- **Mật khẩu mock** chỉ lưu trong bộ nhớ; không dùng cho môi trường thật.
- **i18n:** tiếng Việt mặc định, tiếng Anh chỉ là khung tối thiểu (`app/i18n.ts`); phần lớn chuỗi giao diện hiện viết trực tiếp bằng tiếng Việt.
- **Tìm kiếm/lọc** dùng phân trang (không infinite scroll); hook `useInfiniteScroll` có sẵn nếu muốn đổi.
