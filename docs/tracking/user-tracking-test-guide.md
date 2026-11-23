# Hướng dẫn kiểm thử và bàn giao user tracking FE TutorLink

Ngày cập nhật: 18/11/2026.

Phạm vi: user tracking trên frontend; hướng dẫn kiểm tra tích hợp với backend đang chạy và PostgreSQL. Tài liệu này không yêu cầu sửa BE, các page/component nghiệp vụ hoặc DI container dùng chung. Những mục ghi **cần xác minh** chưa được xác nhận đầy đủ qua thao tác giao diện thực tế.

Các đường dẫn bằng chứng trong tài liệu tính từ thư mục gốc dự án, gồm `tutorlink-fe/` và `tutorlink-be/`. Số dòng phản ánh mã tại thời điểm cập nhật.

## 1. Tóm tắt trạng thái

| Hạng mục | Kết quả đã xác nhận | Giới hạn |
| --- | --- | --- |
| `page_view` | Đã đối chiếu ID trong Payload với các bản ghi DB do người kiểm thử cung cấp | Không suy ra các loại event khác cũng đúng nghiệp vụ |
| ID của event | FE sinh UUID khi tạo event; batch gửi lại giữ nguyên ID | Cơ chế chống trùng thực tế của BE **cần xác minh** |
| Lỗi 400 do thiếu ID | BE đang chạy trả `events[0].id: must not be null`; thêm ID thì request mẫu trả 200 | DTO BE trong workspace chưa phản ánh đầy đủ hợp đồng của bản đang chạy |
| Lỗi 400 của tìm kiếm | Payload cũ thiếu `resultCountScope` và `hasMore`; bổ sung cả hai thì request mẫu trả 200 | Cần test lại hai trang tìm kiếm trên trình duyệt |
| Batch đủ 7 event | API mẫu trả HTTP 200, `TRACKING_SUCCESS`, `data: 7` | Đây là dữ liệu mẫu gửi không kèm token, không phải chứng minh 7 thao tác UI đã chạy đúng |
| Nhận diện người dùng, retry và refresh | Có kiểm thử tự động FE | `user_id` của phiên đăng nhập thực tế **cần xác minh** |
| Kiểm thử tự động FE | 23 test đạt tại lần chạy gần nhất | Không thay thế kiểm thử trình duyệt và DB |
| Lint feature tracking | Không báo lỗi tại lần chạy gần nhất | Không đại diện cho toàn bộ frontend |
| TypeScript toàn FE | Còn lỗi tại các module ngoài tracking | Chưa thể kết luận toàn dự án compile thành công |

**Tiêu chí quan trọng:** một event chỉ được kết luận đã lưu khi đối chiếu được `events[].id` trong Payload với cột `id` của DB. HTTP 200 một mình chưa chứng minh props và người dùng đã đúng.

## 2. Kiến trúc và file liên quan

Luồng hiện tại:

```text
Page/Component
  → Hook hoặc track()
  → Hàng đợi trong tracker.ts
  → TrackingService
  → TrackingGateway / HttpTrackingGateway
  → TrackingHttpClient
  → POST /v1/tracking/events
```

### 2.1 Các file tracking FE

| File | Trách nhiệm |
| --- | --- |
| `tutorlink-fe/src/features/tracking/types/tracking.types.ts` | Kiểu dữ liệu cho 7 event và batch |
| `tutorlink-fe/src/features/tracking/tracker.ts` | Sinh ID event, chụp props, giữ danh tính người tạo, gom batch, gửi tuần tự, retry, page view và lỗi client |
| `tutorlink-fe/src/features/tracking/hooks.ts` | Thời gian xem hồ sơ, tracking tìm kiếm, trạng thái form và xử lý khi rời trang |
| `tutorlink-fe/src/features/tracking/service/tracking.service.ts` | Chọn token đúng tài khoản, làm mới token và điều phối gateway |
| `tutorlink-fe/src/features/tracking/api/tracking.gateway.ts` | Interface gateway |
| `tutorlink-fe/src/features/tracking/api/http.tracking.gateway.ts` | Ghép endpoint tracking và gọi HTTP client |
| `tutorlink-fe/src/features/tracking/http/tracking.http.ts` | Gửi JSON bằng fetch, token tùy chọn, keepalive, timeout và trạng thái HTTP lỗi |
| `tutorlink-fe/src/features/tracking/tracking.container.ts` | Nối dependency riêng của feature, sử dụng dependency đã xuất từ container chung |
| `tutorlink-fe/src/features/tracking/constants.ts` | Giới hạn batch, retry, timeout và các giá trị dùng chung |
| `tutorlink-fe/src/features/tracking/index.ts` | Các export của feature |
| `tutorlink-fe/src/features/tracking/**/*.test.ts` | Kiểm thử tự động của feature |
| `tutorlink-fe/vitest.tracking.config.ts` | File mới ngoài feature, chỉ phục vụ test tracking; không nạp file môi trường |

Các thay đổi chức năng thuộc feature tracking FE. File test config được thêm riêng; không sửa/xóa các file ngoài phạm vi để nối tracking.

Bằng chứng: `tutorlink-fe/src/features/tracking/tracking.container.ts:8`; `tutorlink-fe/src/features/tracking/service/tracking.service.ts:58`; `tutorlink-fe/src/features/tracking/http/tracking.http.ts:15`.

### 2.2 Gửi batch và danh tính

- `track()` sinh ID một lần và chụp lại props, tránh props bị UI thay đổi trong thời gian chờ gửi.
- Danh tính được ghi nhận khi tạo event; các event khác tài khoản không được gộp chung một batch.
- Token mới chỉ được dùng nếu vẫn thuộc tài khoản đã tạo event. Event của khách không tự trở thành event của tài khoản vừa đăng nhập.
- Có làm mới token khi sắp hết hạn hoặc xử lý 401 một lần trong một lượt gửi. Feature không chủ động xóa phiên khi tracking thất bại.
- Mỗi batch tối đa 50 event và có giới hạn kích thước body phục vụ keepalive.
- Batch lỗi được giữ trong bộ nhớ; tự động thử lại tối đa 3 lần. Sự kiện `online` cho phép thử lại các event đang chờ.
- Hàng đợi có giới hạn dung lượng; không phải nơi lưu bền vững. Reload, đóng cưỡng bức trình duyệt hoặc mất mạng kéo dài vẫn có thể làm mất event.
- Một event quá lớn không vừa giới hạn body có thể bị bỏ qua. Không dùng tracking để gửi toàn bộ tài liệu, đối tượng nghiệp vụ hay thông tin nhạy cảm.
- Nếu BE đã lưu nhưng phản hồi bị mất, FE có thể gửi lại. Cần xác minh BE chống trùng theo ID, không suy từ việc FE giữ ID.

Bằng chứng: `tutorlink-fe/src/features/tracking/tracker.ts:104`, `:143`, `:160`; `tutorlink-fe/src/features/tracking/constants.ts:1`; `tutorlink-fe/src/features/tracking/service/tracking.service.ts:58`.

## 3. Hợp đồng request và 7 loại sự kiện

### 3.1 Request chung

- Method: `POST`.
- Endpoint: `/v1/tracking/events`.
- URL thực tế: ghép API base URL đang cấu hình với endpoint; base URL có thể đã bao gồm context path.
- Content-Type: `application/json`.
- Khách: không cần Bearer token.
- Thành viên: gửi token tương ứng với danh tính của event.
- Mỗi phần tử trong `events` có `id`, `name`, `ts`, `props`.

Ví dụ cấu trúc của một event tìm kiếm. UUID dưới đây chỉ để minh họa; test trên UI dùng ID do FE sinh:

```json
{
  "anonId": "00000000-0000-4000-8000-000000000001",
  "sessionId": "00000000-0000-4000-8000-000000000002",
  "events": [
    {
      "id": "00000000-0000-4000-8000-000000000003",
      "name": "search_performed",
      "ts": "2026-11-18T00:00:00.000Z",
      "props": {
        "query": "",
        "filters": {},
        "resultCount": 3,
        "resultCountScope": "LOADED",
        "hasMore": false
      }
    }
  ]
}
```

Không gửi lại ví dụ với cùng ID nhiều lần để đo số lượt mới. Mỗi event mới cần ID mới; retry của cùng event giữ ID cũ.

Bằng chứng: `tutorlink-fe/src/features/tracking/types/tracking.types.ts:24`; `tutorlink-fe/src/features/tracking/tracker.ts:164`; `tutorlink-fe/src/features/tracking/http/tracking.http.ts:21`.

### 3.2 Props của từng event

| Event trong Payload | Props | Điều kiện ghi nhận |
| --- | --- | --- |
| `page_view` | `path`, `referrer` | Vào trang hoặc đổi pathname khi router đã ổn định |
| `application_list_opened` | `postId`, `applicantCount`, `ranked` | Danh sách ứng viên tải thành công; hiện có các giới hạn tại nơi gọi |
| `tutor_profile_viewed` | `tutorId`, `dwellMs`; `section`, `rank` tùy nguồn mở | Rời hồ sơ hoặc pagehide; chỉ cộng thời gian tab hiển thị |
| `tutor_favorited` | `tutorId`, `source` | Thao tác yêu thích; hiện còn lỗi đếm trùng tại nơi gọi |
| `search_performed` | `query`, `filters`, `resultCount`, `resultCountScope`, `hasMore` | Tìm/lọc chủ động, kết quả tải xong và xác định được phân trang từ cache |
| `post_form_step` | `step`, `status` | Trạng thái form một bước; hiện còn giới hạn tại nơi gọi submit |
| `client_error` | `message`, `path` | Lỗi JavaScript, promise chưa xử lý hoặc lỗi route được ghi nhận |

Lưu ý:

- `section` dùng `TOP` hoặc `OTHERS` khi mở từ danh sách ứng viên; mở trực tiếp từ danh sách gia sư có thể thiếu `section/rank`.
- `resultCountScope = LOADED`: `resultCount` là số kết quả đã tải, không phải tổng số trong DB.
- `hasMore` lấy từ `hasNext` của trang cuối trong đúng query tìm kiếm. Không hardcode false để vượt validation.
- Tìm kiếm hiện đọc cache của danh sách gia sư hoặc bài đăng qua query key. Nếu không tìm thấy dữ liệu phân trang tương ứng thì chưa phát event; trường hợp này **cần xác minh** nếu giao diện không sinh request.
- Cuộn tải thêm kết quả không tự được xem là một lượt tìm kiếm mới với cùng key.
- Form hiện dùng `step: 1`, chưa có nhiều bước nghiệp vụ.
- `page_view` hiện phân biệt pathname; thay đổi query/hash trên cùng pathname không tự tạo lượt xem mới.

Bằng chứng: `tutorlink-fe/src/features/tracking/types/tracking.types.ts:1`; `tutorlink-fe/src/features/tracking/hooks.ts:69`, `:109`; `tutorlink-fe/src/features/tracking/tracker.ts:194`.

### 3.3 Khác biệt giữa mã BE local và BE đang chạy

Không dùng riêng DTO local để kết luận request chạy thật đã đúng:

- BE đang chạy đã trả 400 khi thiếu `events[].id`.
- BE đang chạy đã trả 400 cho `search_performed` nếu thiếu `resultCountScope` hoặc `hasMore`.
- Cùng payload mẫu, bổ sung đủ các trường trên thì API trả 200.
- DTO `TrackEventItem` đọc trong workspace tại thời điểm viết tài liệu vẫn chỉ thấy `name`, `props`, `ts`; chưa có trường ID hoặc validation props tương ứng.

Bản BE đang chạy và mã local có dấu hiệu không đồng bộ; phiên bản/nhánh triển khai **cần xác minh** bởi người phụ trách BE. Không sửa BE hoặc tự tạo bảng để che khác biệt này.

Bằng chứng local: `tutorlink-be/src/main/java/org/group3/tutorlink/features/tracking/dto/request/TrackEventItem.java:18`. Bằng chứng runtime: các request mẫu trong đợt kiểm tra ngày cập nhật tài liệu.

## 4. Dữ liệu nằm ở bảng nào?

Cả 7 event tracking đều đối chiếu tại:

```text
public.user_events
```

`public` là schema, `user_events` là bảng. Không phải phải chuyển sang một database mới.

| Payload | Cột DB | Ý nghĩa |
| --- | --- | --- |
| `anonId` | `anon_id` | ID ẩn danh của trình duyệt, lưu lâu dài trong localStorage |
| `sessionId` | `session_id` | ID phiên của tab, lưu trong sessionStorage |
| `events[].id` | `id` | ID riêng của event; phải khớp giữa FE và bản ghi DB |
| Không lấy từ props FE | `user_id` | Người dùng được BE nhận diện qua xác thực; khách dự kiến NULL |
| `events[].name` | `name` | Payload dùng mã chữ thường; ảnh DB đã đối chiếu hiển thị tên enum chữ hoa |
| `events[].props` | `props` | Thuộc tính nghiệp vụ của event |
| `events[].ts` | `occurred_at` | Thời điểm event xảy ra theo đồng hồ FE |
| BE ghi nhận | `received_at` | Thời điểm BE nhận/lưu xử lý event |

Ví dụ mapping tên: `page_view` → `PAGE_VIEW`, `search_performed` → `SEARCH_PERFORMED`.

- Các event cùng trình duyệt/tab thường có cùng `anon_id/session_id`, nhưng mỗi event có `id` riêng.
- Đăng nhập không có nghĩa là `anon_id` biến thành `user_id`.
- Cửa sổ ẩn danh hoặc trình duyệt khác có thể có `anon_id` khác.
- Cùng tab đi từ khách sang đăng nhập có thể giữ nguyên `anon_id/session_id`; `user_id` thay đổi theo danh tính của từng event.
- Timestamp có hậu tố `Z` là UTC. Khi đối chiếu với giờ Việt Nam, cần xét chênh lệch múi giờ; không kết luận sai chỉ vì giờ hiển thị khác nhau.
- Các bảng nghiệp vụ bài đăng, ứng tuyển hoặc yêu thích phục vụ nghiệp vụ riêng; không dùng chúng thay cho bảng tracking để kiểm tra đã ghi event.
- `SystemLog` là dữ liệu log hệ thống riêng; 7 event FE trong tài liệu này đối chiếu bằng `UserEvent`.

Bằng chứng: `tutorlink-be/src/main/java/org/group3/tutorlink/features/tracking/entity/UserEvent.java:15`, `:27`; `tutorlink-be/src/main/java/org/group3/tutorlink/features/tracking/enums/ClientEventType.java:9`.

## 5. Chuẩn bị trước khi test thủ công

1. Chạy FE và BE theo quy trình đang dùng của dự án. Tài liệu này không xác nhận các dịch vụ phụ thuộc đã sẵn sàng.
2. Bảo đảm tracking được bật và nhánh mock tracking được tắt theo cấu hình do người phụ trách quản lý.
3. Các tên cấu hình liên quan là `VITE_TRACKING_ENABLED`, `VITE_TRACKING_FLUSH_SECONDS`, `VITE_GA_ID`, `VITE_API_BASE_URL`. Không đưa giá trị cấu hình hoặc bí mật vào báo cáo test.
4. Nhấn **Ctrl + Shift + R** sau khi cập nhật FE để loại batch cũ đang giữ payload thiếu trường. Thao tác này cũng làm mất các event còn chờ trong bộ nhớ của phiên trang cũ.
5. Mở DevTools bằng **F12**, chọn **Network**, bật **Keep log**; một số trình duyệt gọi là **Preserve log**.
6. Gõ `tracking/events` vào ô lọc.
7. Chọn dòng có **Request Method POST**, **Type fetch**. Dòng `OPTIONS/preflight` chỉ là bước kiểm tra trước request.
8. Sau một thao tác test, chuyển sang tab trình duyệt khác rồi quay lại để kích hoạt flush. Các event xem hồ sơ thường chỉ xuất hiện khi rời hồ sơ/pagehide.
9. Lấy `sessionId` từ tab **Payload** của chính cửa sổ đang test để lọc DB.

Giải thích Network:

- Preflight 200 không chứng minh tracking đã lưu.
- POST 200 xác nhận server đã trả thành công; cần đối chiếu DB để kết luận đúng event và props.
- Biểu tượng dấu x đỏ thể hiện request lỗi; xem status để phân biệt 400 và 401.
- Biểu tượng cạnh tên request thể hiện loại request, không phải ô để bật tracking.
- Response trống trong DevTools chưa đủ để kết luận thành công hoặc thất bại của việc lưu. Dùng Payload, status và DB để đối chiếu.
- Nút Clear của Network chỉ xóa danh sách hiển thị, không xóa dữ liệu DB.

## 6. Các câu SQL dùng khi test

Các chuỗi viết hoa bên dưới là chỗ thay bằng ID từ Payload; không chạy nguyên placeholder rồi kết luận không có dữ liệu.

### 6.1 Kiểm tra database/schema và vị trí bảng

```sql
SELECT current_database(), current_schema();

SELECT table_catalog, table_schema, table_name
FROM information_schema.tables
WHERE table_name ILIKE '%event%'
ORDER BY table_schema, table_name;
```

Nếu bảng không xuất hiện ở cây dữ liệu, refresh danh sách schema/bảng trước. Không tự tạo bảng khi chưa xác nhận đúng DB và đúng bản BE.

### 6.2 Xem các event của đúng tab đang kiểm thử

```sql
SELECT
    id,
    anon_id,
    session_id,
    user_id,
    name,
    props,
    occurred_at,
    received_at
FROM public.user_events
WHERE session_id = 'SESSION_ID_TU_PAYLOAD'
ORDER BY received_at DESC;
```

### 6.3 Đối chiếu một event cụ thể

```sql
SELECT id, anon_id, session_id, user_id, name, props
FROM public.user_events
WHERE id = CAST('EVENT_ID_TU_PAYLOAD' AS uuid);
```

Phải dùng `events[].id`, không dùng `anonId` để tìm cột `id`.

### 6.4 Đếm loại event của phiên đang test

```sql
SELECT name, COUNT(*) AS event_count
FROM public.user_events
WHERE session_id = 'SESSION_ID_TU_PAYLOAD'
GROUP BY name
ORDER BY name;
```

So sánh số lượng trước/sau từng thao tác. Không kết luận một event bị phát trùng chỉ từ tổng lịch sử của cả phiên.

### 6.5 Kiểm tra danh tính khách/thành viên

```sql
SELECT id, name, user_id, occurred_at, received_at
FROM public.user_events
WHERE session_id = 'SESSION_ID_TU_PAYLOAD'
ORDER BY occurred_at DESC;
```

Nếu cùng một tab đã dùng cả hai chế độ, các event khách trước khi đăng nhập có thể vẫn có `user_id = NULL`; chỉ kiểm tra các event mới thuộc bước đang test.

## 7. Test phiên KHÔNG ĐĂNG NHẬP

Mở cửa sổ ẩn danh mới, vào website và không đăng nhập. Mở Network trong chính cửa sổ này. Phiên khách không cần tạo đủ cả 7 event vì một số thao tác nghiệp vụ yêu cầu tài khoản.

### G01 — Xem trang

1. Vào trang chủ.
2. Bấm **Tìm gia sư**.
3. Bấm quay về trang chủ.
4. Đổi tab trình duyệt rồi quay lại; mở request POST mới.
5. Tìm các event `page_view` trong Payload và đối chiếu từng ID với DB.

Kỳ vọng:

- `props.path` khớp trang vừa vào.
- `props.referrer` là trang trước trong SPA; lượt đầu có thể là referrer của trình duyệt.
- DB có `name = PAGE_VIEW`.
- `user_id = NULL`.

### G02 — Tìm kiếm/lọc

1. Vào **Tìm gia sư**.
2. Chọn môn học hoặc tỉnh/thành; có thể nhập từ khóa thay cho chọn môn.
3. Chờ kết quả tải xong.
4. Đổi tab rồi quay lại để gửi.
5. Tìm event `search_performed`.

Kỳ vọng:

- Có `query`, `filters`, `resultCount`.
- Bắt buộc có `resultCountScope: LOADED` và `hasMore`.
- `hasMore` khớp `hasNext` của trang cuối đã tải, không phải suy từ `resultCount`.
- `resultCount` là số dòng đã tải tại lúc ghi event.
- DB có `name = SEARCH_PERFORMED`, `user_id = NULL`.
- Không còn 400 do thiếu hai trường metadata.

Lặp lại tại trang tìm bài/lớp với bộ lọc phù hợp. Sau đó xóa hết điều kiện và tìm lại cùng điều kiện để kiểm tra lượt tìm kiếm mới được ghi nhận. Cuộn tải thêm với cùng key không được tự coi là một lượt tìm kiếm mới.

### G03 — Xem hồ sơ gia sư

1. Trong danh sách gia sư, bấm **Xem hồ sơ**.
2. Xem khoảng 5 giây.
3. Chuyển sang tab trình duyệt khác khoảng 10 giây.
4. Quay lại xem thêm khoảng 5 giây.
5. Bấm quay lại danh sách.
6. Kiểm tra event `tutor_profile_viewed`.

Kỳ vọng:

- `tutorId` đúng hồ sơ đã mở.
- `dwellMs` gần 10.000 ms, cho phép chênh lệch thao tác; không cộng toàn bộ thời gian tab bị ẩn.
- DB có `TUTOR_PROFILE_VIEWED`, `user_id = NULL`.
- Mở từ danh sách gia sư thông thường có thể không có `section/rank`.
- Bổ sung lần test reload khi đang xem hồ sơ; thao tác đóng tab hoàn toàn cần đối chiếu DB từ cửa sổ khác.

Nguồn phát: `tutorlink-fe/src/features/tracking/hooks.ts:39`.

### G04 — Lỗi JavaScript có chủ đích

Mở tab Console và chạy:

```javascript
setTimeout(() => {
  throw new Error('tracking-test-guest-' + Date.now());
}, 0);
```

Đây là lỗi thử được tạo có chủ đích. Sau đó đổi tab rồi quay lại.

Kỳ vọng:

- Có `client_error`, `props.message` chứa tiền tố vừa tạo.
- `props.path` đúng trang đang mở.
- DB có `CLIENT_ERROR`, `user_id = NULL`.
- Message có timestamp để không bị cơ chế chống ghi lặp cùng lỗi bỏ qua.

### G05 — Các thao tác cần đăng nhập

Thử mở nơi đăng bài hoặc thao tác lưu gia sư khi chưa đăng nhập.

Kỳ vọng nghiệp vụ:

- Giao diện có thể chuyển sang đăng nhập hoặc chưa cho thao tác.
- Không yêu cầu khách sinh `application_list_opened`, `tutor_favorited`, `post_form_step` từ các thao tác không được thực hiện.
- `page_view` của trang đăng nhập vẫn có thể xuất hiện; không nhầm đây là lỗi tracking.

## 8. Test phiên ĐÃ ĐĂNG NHẬP

Dùng tài khoản HỌC VIÊN được người kiểm thử chuẩn bị. Không đưa tài khoản/mật khẩu vào báo cáo hoặc tài liệu.

1. Đăng nhập.
2. Clear Network để dễ phân biệt request cũ và mới.
3. Lấy `sessionId` của cửa sổ này và thay vào câu SQL.
4. Lặp lại G01, G02, G03.
5. Kiểm tra event phát sinh sau đăng nhập có `user_id` đúng tài khoản hiện tại.

Cùng trình duyệt/tab có thể giữ `anonId/sessionId` sau đăng nhập. Nếu dùng cửa sổ ẩn danh và cửa sổ thường thì các mã có thể khác; cả hai đều bình thường.

### L01 — Yêu thích gia sư

1. Vào hồ sơ một gia sư chưa nằm trong danh sách yêu thích.
2. Bấm **Lưu vào yêu thích**.
3. Chờ thao tác thành công, đổi tab rồi quay lại.
4. Đối chiếu số event mới, `tutorId`, `source`, `user_id`.
5. Bấm bỏ yêu thích và kiểm tra riêng lần nữa.

Kỳ vọng nghiệp vụ:

- Thêm thành công phát đúng một `TUTOR_FAVORITED`.
- Bỏ yêu thích không bị ghi là thêm yêu thích.

**Lỗi đã thấy trong mã ngoài phạm vi:** hook và trang hồ sơ đều phát event; lần thêm có thể phát hai event, lần bỏ vẫn có event tại page. Ghi nhận lỗi này nếu tái hiện được, không đánh dấu đạt chỉ vì API trả 200.

Bằng chứng: `tutorlink-fe/src/features/favorite/hooks/useFavorites.ts:34`; `tutorlink-fe/src/pages/TutorDetailPage.tsx:113`.

### L02 — Mở danh sách ứng viên

Điều kiện: học viên có bài đã đăng, không phải nháp, và có dữ liệu ứng viên để đối chiếu.

1. Vào **Bài đăng của tôi**.
2. Mở bài của mình.
3. Xem phần danh sách ứng viên.
4. Đổi tab rồi quay lại.
5. Tìm `application_list_opened`, đối chiếu `postId`, `applicantCount`, `ranked`.

Kỳ vọng nghiệp vụ:

- Số ứng viên phù hợp với danh sách đang kiểm tra.
- Nếu kết quả xếp hạng đã hiển thị, `ranked` phải phản ánh đúng kết quả.
- Refetch dữ liệu không nên bị đếm thành một lần người dùng mở mới.
- Dùng bài có trên 5 ứng viên pending để kiểm tra trường hợp đủ điều kiện xếp hạng, tùy cấu hình thực tế của BE.

**Giới hạn hiện tại:** dữ liệu tracking đang suy `ranked` từ danh sách thường; danh sách ứng viên lấy qua một trang 100 đơn của tài khoản rồi lọc theo bài. Không kết luận các trường này đúng chỉ từ HTTP 200.

Bằng chứng: `tutorlink-fe/src/features/application/components/ApplicantList.tsx:56`; `tutorlink-fe/src/features/application/service/application.service.ts:209`.

### L03 — Nguồn xem hồ sơ TOP/OTHERS

1. Mở bài có danh sách ứng viên và khung Top 5 nếu có.
2. Bấm xem hồ sơ từ Top 5, xem vài giây rồi rời hồ sơ.
3. Kiểm tra `section: TOP`, `rank` tương ứng.
4. Mở hồ sơ từ danh sách thường, xem rồi rời.
5. Kiểm tra `section: OTHERS`; `rank` phụ thuộc dữ liệu nguồn, không tự suy thứ hạng toàn bộ danh sách.

Trường hợp không có khung xếp hạng hoặc không đủ dữ liệu: ghi **không đủ điều kiện test**, không đánh dấu thất bại giao thức.

### L04 — Form đăng bài

Thực hiện từng trường hợp riêng, chờ gửi batch và đối chiếu event mới sau mỗi lần.

| Trường hợp | Cách bấm | Kỳ vọng nghiệp vụ |
| --- | --- | --- |
| Đăng thành công | Bài đăng của tôi → Đăng bài mới → điền hợp lệ → đăng công khai | `POST_FORM_STEP`, `step: 1`, `COMPLETED` |
| Bỏ dở | Mở form mới → thay đổi ít nhất một trường → sang trang khác mà không lưu | `POST_FORM_STEP`, `step: 1`, `ABANDONED` |
| Lưu nháp thành công | Điền form → lưu nháp | Không bị ghi nhầm thành bỏ dở |
| Validation phía giao diện | Bỏ trống trường bắt buộc → bấm đăng | Không phát hoàn thành khi bài chưa được lưu |
| Lỗi request submit | Cho request nghiệp vụ thất bại trong môi trường test | Không được phát `COMPLETED` cho thao tác thất bại |
| Reload khi đang nhập | Nhập dữ liệu rồi reload | Kiểm tra có ghi bỏ dở khi pagehide; việc giao nhận vẫn là best effort |

**Các lỗi ngoài phạm vi còn tồn tại:**

- Form chỉ gọi đánh dấu hoàn thành khi không lưu nháp.
- Page có thể trả `undefined` khi lỗi không có fieldErrors; form có thể diễn giải thành thành công.
- Việc đánh dấu sau khi page bắt đầu điều hướng có khả năng phụ thuộc timing, **cần xác minh**.
- Trạng thái hoàn thành form vẫn dùng biến chung trong hook; không kết luận hỗ trợ đúng nhiều form cùng mount.

Bằng chứng: `tutorlink-fe/src/features/post/components/PostForm.tsx:242`, `:264`; `tutorlink-fe/src/pages/PostCreatePage.tsx:18`, `:25`; `tutorlink-fe/src/pages/PostEditPage.tsx:29`, `:45`; `tutorlink-fe/src/features/tracking/hooks.ts:125`.

### L05 — Lỗi client khi đăng nhập

Làm như G04 nhưng dùng tiền tố khác:

```javascript
setTimeout(() => {
  throw new Error('tracking-test-member-' + Date.now());
}, 0);
```

Kỳ vọng: `CLIENT_ERROR` có `user_id` đúng tài khoản. Việc Console có dòng lỗi đỏ là kết quả cố ý của bài test.

## 9. Test mất mạng, token và vòng đời trang

### R01 — Mất mạng rồi có mạng lại

1. Tạo một event mới.
2. Trong Network, chuyển sang Offline.
3. Đổi tab rồi quay lại để thử gửi.
4. Kiểm tra request thất bại.
5. Chuyển lại Online.
6. Quan sát request gửi lại và đối chiếu ID.

Kỳ vọng: retry giữ ID, không sinh ID mới cho cùng event. Số lần tự retry có giới hạn; event `online` cho phép thử lại batch đang giữ.

Cần xác minh thêm: BE có lưu trùng khi phản hồi lần đầu bị mất hay không. Không giả lập việc đã lưu thành công chỉ bằng cách chặn mạng trước request.

### R02 — Token hết hạn hoặc request trả 401

1. Test trong phiên thành viên với điều kiện hết hạn do môi trường test kiểm soát.
2. Quan sát request làm mới token nếu có và lần gửi lại tracking.
3. Không sửa hoặc chia sẻ token để mô phỏng.

Kỳ vọng theo mã FE: làm mới token sắp hết hạn; khi cần xử lý 401 thì thử lại một lần trong lượt gửi; không dùng tài khoản khác để refresh event cũ; tracking không chủ động xóa phiên.

Nếu refresh cũng bị từ chối: ghi status và thông báo lỗi an toàn; không kết luận lỗi FE hay BE chỉ từ 401.

### R03 — Đổi trạng thái đăng nhập

1. Tạo event khi là khách.
2. Đăng nhập rồi tạo event khác.
3. Đăng xuất rồi tạo thêm một event.
4. Đối chiếu `user_id` theo thời điểm tạo event, không chỉ theo thời điểm batch được gửi.

Kỳ vọng: event khách không bị gán sang tài khoản mới; event tài khoản cũ không bị gửi bằng token của tài khoản khác.

### R04 — Rời trang, reload và đóng tab

- Thử rời hồ sơ bằng điều hướng SPA, reload và đóng tab ở các lượt riêng.
- Thử nhập form rồi rời trang.
- Dùng cửa sổ DB khác để kiểm tra event lúc đóng tab.
- `keepalive` và `pagehide` chỉ cải thiện khả năng giao nhận, không bảo đảm trong mọi trường hợp browser/process bị tắt.
- Khôi phục trang từ bộ nhớ quay lại của trình duyệt và thiết bị di động **cần xác minh** thêm; chưa có bằng chứng bao phủ đầy đủ.

## 10. Chẩn đoán lỗi đã gặp

### 10.1 HTTP 400: thiếu ID

Response thực tế đã quan sát:

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "events[0].id": "must not be null"
  }
}
```

Đã xử lý tại FE: sinh `id` trong `track()` và giữ ID trong hàng đợi khi retry.

Bằng chứng: `tutorlink-fe/src/features/tracking/tracker.ts:164`.

### 10.2 HTTP 400: tìm kiếm thiếu metadata, làm lỗi cả batch

Payload tìm kiếm cũ có `query`, `filters`, `resultCount` nhưng thiếu hai trường mới.

Kết quả request mẫu tới BE đang chạy:

| Payload tìm kiếm | HTTP thực tế |
| --- | --- |
| Thiếu cả `resultCountScope` và `hasMore` | 400 |
| Chỉ thêm `resultCountScope` | 400 |
| Chỉ thêm `hasMore` | 400 |
| Có cả `resultCountScope: LOADED` và `hasMore` boolean | 200 |

Response lỗi có `errors.events[0]: Invalid tracking event properties`.

Một request có nhiều event có thể bị từ chối toàn bộ khi một event không hợp lệ. Vì vậy thấy `page_view` hoặc event khác trong batch 400 chưa chứng minh từng loại đều sai.

Đã bổ sung hai trường trong hook tracking. `hasMore` được đọc từ query cache của chính kết quả tìm kiếm, không sửa page hoặc gán giá trị giả.

Bằng chứng: `tutorlink-fe/src/features/tracking/hooks.ts:69`, `:109`; `tutorlink-fe/src/features/tracking/types/tracking.types.ts:11`.

### 10.3 HTTP 401

- Kiểm tra request lỗi có phát sinh khi là khách hay thành viên.
- Chỉ ghi nhận có/không có Authorization, không sao chép nội dung token.
- Trạng thái guest trên UI chưa tự chứng minh trình duyệt không còn token lưu trước đó.
- Endpoint public vẫn có thể bị bộ lọc xác thực từ chối nếu request đính kèm Bearer token không hợp lệ.
- Request mẫu không token đã được BE đang chạy chấp nhận; không thể kết luận mọi 401 đều do thiếu đăng nhập.
- Nguyên nhân chính xác của các request 401 cũ **chưa được xác nhận**. Cơ chế refresh FE đã có test, không thay cho chẩn đoán từng request thật.

### 10.4 Response không hiện trong DevTools

1. Clear Network.
2. Tạo request mới và chọn đúng POST/fetch.
3. Xem cả Preview và Response.
4. Nếu vẫn không hiển thị, ghi status và Payload; đối chiếu DB bằng event ID.
5. Đừng lấy response của preflight để kết luận request tracking.

Khi cần báo lỗi, Payload và status đã đủ để người kiểm tra tạo lại request mẫu, không cần gửi Headers hoặc HAR có thể chứa thông tin xác thực.

### 10.5 Dấu gạch chéo trong nội dung sao chép

Chuỗi `http\://...` không hợp lệ nếu dấu gạch chéo thực sự có trong JSON gốc. Tuy nhiên FE dùng `JSON.stringify`; trong đợt kiểm tra, DB đã hiển thị referrer bình thường và ID khớp Payload. Không tiếp tục kết luận dấu xuất hiện khi dán vào chat là nguyên nhân request thật lỗi.

Bằng chứng: `tutorlink-fe/src/features/tracking/http/tracking.http.ts:21`; kết quả đối chiếu DB do người kiểm thử cung cấp.

## 11. Các phần còn cần người phụ trách module xử lý

| Vấn đề | Vị trí/bằng chứng | Cách ghi kết quả test |
| --- | --- | --- |
| Yêu thích phát hai lần, bỏ yêu thích vẫn phát event thêm | `tutorlink-fe/src/features/favorite/hooks/useFavorites.ts:34`; `tutorlink-fe/src/pages/TutorDetailPage.tsx:113` | Ghi số event tăng sau từng thao tác |
| `ranked` suy từ danh sách không có thứ hạng AI | `tutorlink-fe/src/features/application/components/ApplicantList.tsx:56` | Chụp trạng thái panel và props của cùng lượt mở |
| Đếm ứng viên có giới hạn một trang 100 đơn rồi lọc | `tutorlink-fe/src/features/application/service/application.service.ts:209` | Cần dữ liệu đủ lớn để tái hiện |
| Trạng thái lưu nháp/thất bại có thể bị ghi sai | `tutorlink-fe/src/features/post/components/PostForm.tsx:242`; `tutorlink-fe/src/pages/PostCreatePage.tsx:25` | Ghi kết quả submit thực tế cùng event |
| Bộ lọc phường/xã chưa được gửi đủ vào props tìm bài | `tutorlink-fe/src/pages/FindClassPage.tsx:94` | Đối chiếu bộ lọc UI, query API nghiệp vụ và props tracking |
| Bản BE local khác hợp đồng BE đang chạy | `tutorlink-be/src/main/java/org/group3/tutorlink/features/tracking/dto/request/TrackEventItem.java:18` và các response runtime ở mục 10 | Ghi nhận phiên bản/nhánh BE theo quy trình dự án; không sửa bí mật cấu hình |

Những mục này chưa được sửa trong đợt giới hạn tracking FE. Không đánh dấu test đạt hoàn toàn chỉ vì server trả 200 và DB có bản ghi.

## 12. Kiểm thử tự động

Chạy trong thư mục `tutorlink-fe`:

```powershell
npm run test -- --config vitest.tracking.config.ts
```

Lint riêng feature:

```powershell
npx --no-install oxlint src/features/tracking
```

Kiểm tra TypeScript không sinh output:

```powershell
npx --no-install tsc --noEmit --incremental false --project tsconfig.app.json --pretty false
```

- Các lệnh giả định dependency đã có sẵn; không yêu cầu cài mới.
- Test config dùng `envDir: false`, chỉ chọn test tracking.
- Lần chạy gần nhất: 23 test đạt; lint sạch.
- TypeScript toàn FE vẫn vướng lỗi tại application, favorite, wallet, mock, admin và layout ngoài tracking; chưa sửa các file đó.
- Các test bao phủ nhận diện khách/thành viên, refresh/401, retry, ID riêng và giữ ID khi retry, phân batch, chụp props, cache tìm kiếm và vòng đời hook.
- Unit test không chứng minh các page thực sự gọi đúng một lần, hoặc BE lưu đúng mọi props và quyền.

Bằng chứng: `tutorlink-fe/vitest.tracking.config.ts:5`; `tutorlink-fe/src/features/tracking/tracker.test.ts`; `tutorlink-fe/src/features/tracking/hooks.test.ts`; `tutorlink-fe/src/features/tracking/service/tracking.service.test.ts`.

## 13. Kết quả API mẫu đã chạy

Trong đợt kiểm tra này đã gửi request mẫu không kèm token tới endpoint tracking của BE đang chạy.

| Loại event | Kết quả trước khi bổ sung metadata tìm kiếm |
| --- | --- |
| `page_view` có ID | 200, `data: 1` |
| `application_list_opened` | 200, `data: 1` |
| `tutor_profile_viewed` | 200, `data: 1` |
| `tutor_favorited` | 200, `data: 1` |
| `search_performed` thiếu metadata | 400 |
| `post_form_step` | 200, `data: 1` |
| `client_error` | 200, `data: 1` |

Sau khi bổ sung đủ props tìm kiếm, batch mẫu 7 event trả:

```json
{
  "status": 200,
  "code": "TRACKING_SUCCESS",
  "data": 7
}
```

Các event mẫu dùng dữ liệu thử; một số props có dấu hiệu `tracking-probe` hoặc đường dẫn `/__tracking_probe__`. Chúng không chứng minh đã phát sinh hành vi ứng tuyển, yêu thích hoặc đăng bài thật.

Không có bằng chứng từ lần probe này rằng `user_id` thành viên đúng, source UI đúng, không đếm trùng hoặc BE chống trùng khi retry. Các mục đó phải test theo phần 8 và 9.

## 14. Mẫu báo lỗi và bảng nghiệm thu

### 14.1 Thông tin cần gửi khi có lỗi

```text
Mã test:
Phiên: khách / học viên / gia sư
Thao tác vừa thực hiện:
Event cần kiểm tra:
Status của request POST:
Payload của toàn bộ batch:
Response: có nội dung / trống
Event ID cần đối chiếu:
Kết quả DB của ID đó:
Kỳ vọng:
Thực tế:
```

- Không gửi token, nội dung Authorization, tài khoản, mật khẩu hoặc file môi trường.
- Có thể có nhiều event trong một batch; cần giữ toàn bộ Payload để tìm đúng phần tử lỗi.
- Nếu Response trống, chỉ cần ghi rõ; không cần đoán thông báo lỗi.
- Với lỗi props, phân biệt HTTP lỗi với HTTP thành công nhưng dữ liệu nghiệp vụ sai.

### 14.2 Checklist nghiệm thu thủ công

Các ô dưới đây để người kiểm thử điền, không phải tuyên bố đã hoàn tất.

- [ ] G01: page_view của khách khớp Payload và DB.
- [ ] G02: tìm kiếm gia sư của khách đủ metadata và không 400.
- [ ] G02: tìm bài/lớp đủ metadata và không 400.
- [ ] G03: thời gian xem chỉ tính lúc tab hiển thị.
- [ ] G04: lỗi client thử được ghi đúng.
- [ ] G05: khách không được coi là đã thực hiện nghiệp vụ yêu cầu đăng nhập.
- [ ] Phiên thành viên: các event mới có đúng user_id.
- [ ] L01: yêu thích chỉ phát đúng số event theo hành vi.
- [ ] L02: số ứng viên và ranked khớp dữ liệu thật.
- [ ] L03: nguồn TOP/OTHERS và rank đúng ngữ cảnh.
- [ ] L04: đăng thành công, lưu nháp, lỗi submit và bỏ dở được phân biệt đúng.
- [ ] L05: client_error của thành viên có đúng user_id.
- [ ] R01: retry giữ ID và đã kiểm chứng chống trùng tại BE.
- [ ] R02: xử lý 401 không lặp vô hạn hoặc làm sai tài khoản.
- [ ] R03: không gán event khách sang tài khoản mới.
- [ ] R04: đã ghi giới hạn của reload/đóng tab/khôi phục trang.

