# Bàn giao FE TutorLink: bài đăng, ứng tuyển, admin và realtime thông báo

Ngày: 14/11/2026. Phạm vi: các thay đổi FE trong đợt làm việc này. Việc BE đi kèm nằm trong tài liệu Bàn giao BE. Mục nào ghi «cần kiểm tra» là chỗ chưa được chạy thử trên project thật.

## 1. Tóm tắt

| # | Hạng mục | Trạng thái FE | Phụ thuộc BE |
| --- | --- | --- | --- |
| 1 | Form sửa bài đăng | Xong | Không |
| 2 | Xóa bài không còn lỗi 404 | Xong | Không |
| 3 | Admin: danh sách bài (bộ lọc, cuộn tải thêm) | Xong | Cần tham số `status` để lọc trạng thái |
| 4 | Admin: chi tiết mọi bài | Xong | Đã có `GET /v1/posts/{id}/admin` |
| 5 | Module ứng tuyển bỏ mock, gọi API thật | Xong | Cần `student`, `tutor` trong `ApplicationResponse`; nên thêm `post` rút gọn |
| 6 | Xếp hạng ứng viên bằng AI | Xong | Dùng `ranked`, `top` |
| 7 | Realtime thông báo | Xong, chờ BE đẩy event | Cần event `NOTIFICATION_NEW` |
| 8 | Số chưa đọc trên chuông | Xong | Cần `GET /v1/notifications/unread-count` |

## 2. Bài đăng

### 2.1 Form sửa bài

- `PostForm`: khi tạo mới vẫn có hai nút Lưu nháp và Đăng bài; khi sửa (`defaultValues` có giá trị) chỉ còn một nút «Lưu thay đổi» (key `post.saveChanges`, có chuỗi mặc định).
- Effect xóa phường/xã chỉ chạy khi người dùng đổi tỉnh (so với giá trị trước bằng `useRef`), không chạy lúc mở form. Nhờ vậy phường/xã ban đầu của bài không bị xóa. Effect trùng đã bị gỡ.
- `PostEditPage`: trả `fieldErrors` của `ApiError` về form để gắn lỗi vào đúng ô, và dùng toast `post.updateSuccess` thay vì thông báo đăng bài.
- Cần kiểm tra: nếu phường/xã vẫn mất khi mở form sửa thì nguyên nhân nằm trong `useAddressSelect` (hook tự đặt lại phường/xã lúc mount). Hook này chưa được xem.

### 2.2 Xóa bài

- Mutation `remove` trong `usePostMutations`: hủy rồi xóa cache của `detail`, `detailMe`, `applications` của bài đó, sau đó chỉ invalidate các query không chứa id bài. Nhờ vậy không còn refetch bài vừa xóa.
- `PostDetailPage`: có cờ `deleting`; khi đang xóa thì hiện skeleton, tránh nháy màn hình «không tìm thấy bài».
- Lưu ý: tham số thứ hai của `usePostDetail` là `isLoggedIn` (chọn endpoint `/me` hay công khai), không phải `enabled`. Không gắn `deleting` vào đó, vì bài nháp sẽ chuyển sang endpoint công khai và trả 404.

## 3. Admin quản lý bài đăng

### 3.1 Danh sách

- `AdminPostFilter` = `PostFilter` bỏ `authorId`, `province`, thêm `status?: PostStatus | ''`.
- `useAdminPosts` dùng `useInfiniteQuery` gọi `postService.getAdminPosts`, phân trang theo cursor (`hasNext`, `nextCursor`), key `[...adminKeys.posts, 'list', filter]`.
- `AdminPostsPage`: hiện `PostCard`, cột bộ lọc bên trái (`FilterSidebar` với `hideProvince`), cuộn tới đâu tải tới đó bằng `IntersectionObserver` (`rootMargin` 300px). Chọn nhiều cấp học thì BE chỉ nhận một giá trị nên FE lọc thêm phía client.
- Cột bộ lọc cố định khi cuộn: `lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto`. Nếu layout admin có header cố định hoặc vùng cuộn riêng thì chỉnh `top` và `max-h`.
- Cần kiểm tra: `useAdminMutations.removePost` phải gọi `postService.removePostByAdmin(id, reason)` thay vì `adminService.removePost` (hàm mock gây lỗi «Session expired»).
- Giới hạn: ô lọc trạng thái chưa có tác dụng cho đến khi BE nhận tham số `status`.

### 3.2 Chi tiết mọi bài

- Gateway `getByIdForAdmin` → `GET /v1/posts/{id}/admin`; `PostService.getPostByIdForAdmin`.
- `usePostForAdmin(id)` và `usePostDetail(id, isLoggedIn, isAdmin = false)`: admin gọi endpoint admin, người khác giữ luồng `/me` rồi công khai.
- `PostDetailPage`: `isAdmin` ẩn nút đăng ký nhận lớp. Nút sửa, xóa vốn chỉ hiện với tác giả.

## 4. Module ứng tuyển

### 4.1 Kiến trúc

Tách theo pattern của post: `ApplicationGateway` (interface) → `HttpApplicationGateway` (dùng `privateHttpClient`) → `ApplicationService` (class, nhận gateway và `postService`). Đăng ký trong `config/di/container.ts`:

```ts
export const applicationService = new ApplicationService(
  new HttpApplicationGateway(privateHttpClient),
  postService,
);
```

`useApplications.ts` import `applicationService` từ `@/config/di/container`. Các method là arrow property nên truyền thẳng làm `queryFn` hoặc `mutationFn` không mất `this`. Toàn bộ nhánh mock đã được bỏ.

### 4.2 Endpoint đang gọi

| Method FE | Endpoint |
| --- | --- |
| `applyToPost` | `POST /v1/applications` |
| `getMyApplications`, `getMyApplicationsForPost` | `GET /v1/applications/mine?limit=100` |
| `getApplicationsByPost` | `GET /v1/posts/{postId}/applications` |
| `getAiTop5` | `GET /v1/applications/post/{postId}/ranked` |
| `selectApplicant`, `confirmApplication`, `finishApplication` | `POST /v1/applications/{id}/select`, `/confirm`, `/finish` |
| `declineOffer`, `cancelApplication` | `POST /v1/applications/{id}/cancel` |
| `confirmAndPayFee` | `POST /v1/payments/applications/{id}/pay`, rồi đọc lại đơn |

BE còn `POST /v1/applications/{id}/reject` mà FE chưa dùng.

### 4.3 Ghép dữ liệu cho đơn (`enrichMany`)

- `student`, `tutor` lấy từ response (`UserSummary`: `id`, `fullName`, `avatarUrl`), không còn gọi public-profile. Các field khác của người dùng (email, điện thoại...) để trống.
- `post` lấy bằng `postService.getPostById`; lỗi thì thử `getPostByIdForMe`; vẫn lỗi thì bỏ đơn đó khỏi danh sách (không làm hỏng cả danh sách).
- `getMyApplicationsForPost(post)` chỉ lọc đơn của bài đang xem và dùng luôn object `post` đã tải, nên bài `CLOSED` không làm mất đơn.
- Sau các thao tác (select, confirm, finish, cancel, apply): nếu không đọc được bài (thường vì bài vừa chuyển `CLOSED`) thì trả đơn với `post = { id }`, không báo lỗi. Thao tác đã thành công ở BE.
- `getApplicationsByPost` (modal admin) vẫn gọi public-profile cho từng người, có cache dùng chung 5 phút.

### 4.4 Xếp hạng AI

- `getAiTop5`: nếu `ranked = false` trả `items` rỗng và `ranked: false`; nếu `true` thì chỉ lấy `top` (5 người), ghép theo `application.id`, thứ tự điểm của BE.
- `AiTop5Panel` ẩn khi `data?.ranked === false`.
- `aiReason` là chuỗi thông báo tiếng Việt từ `features/application/matchWarning.ts`:

| Mã BE | Thông báo |
| --- | --- |
| `SUBJECT_MISMATCH` | Gia sư không dạy môn học của bài đăng |
| `LEVEL_MISMATCH` | Gia sư chưa dạy cấp học này |
| `MODE_MISMATCH` | Hình thức dạy (online/offline) không khớp |
| `AREA_MISMATCH` | Khu vực dạy không phù hợp |
| `AVAILABILITY_MISMATCH` | Lịch rảnh không khớp lịch học của bài đăng |

Mã lạ trả lại đúng mã đó, không làm vỡ giao diện.

### 4.5 Kiểu dữ liệu

- `application.dto.ts`: `ApplicationResponse` có `student`, `tutor` (`UserSummary`) thay cho `studentId`, `tutorId`; `proposedFee` có thể `null`; `ScoredApplicationResponse.breakdown` là `Record<string, number>`.
- `AiSuggestionResponse` thêm `ranked?: boolean`.

### 4.6 Hook và màn hình

- `useMyApplicationsForPost(post, enabled)`: key `[...queryKeys.applications.mine, 'post', post.id]`, nằm dưới `mine` nên các mutation invalidate được.
- `PostDetailPage` gọi hook này ngay sau `usePostDetail`; `ApplicantList` dùng cùng hook, lọc bỏ đơn `CANCELLED` và sắp theo `appliedAt`.
- Cần kiểm tra: `OfferList` và `MyApplicationsPage` vẫn dùng `useMyApplications`, nên đơn thuộc bài `CLOSED` của gia sư chưa hiện đủ cho đến khi BE thêm `post` rút gọn vào `ApplicationResponse`.

## 5. Thông báo

### 5.1 Realtime

- Nguyên nhân cũ: `useNotificationRealtime` có trong code nhưng không nơi nào gọi.
- Thêm `NotificationRealtimeBinding` (`features/notification/realtime/`): đăng ký `NOTIFICATION_NEW` vào `RealtimeEventRouter`, invalidate `['notifications']` và hiện toast `info` theo `data.title`; kết nối lại thì làm mới danh sách.
- Mount trong `main.tsx`, giữa `ChatRealtimeBinding` và `RealtimeBridge`:

```tsx
<NotificationRealtimeBinding client={realtimeClient} router={realtimeRouter} />
```

- Có thể xóa `useNotificationRealtime.ts`. Giữ lại thì không gọi cùng binding, nếu không toast hiện hai lần.
- Event phải đúng phong bì `type`, `occurredAt`, `data`, nếu không FE bỏ qua và chỉ in cảnh báo trong console.

### 5.2 Số chưa đọc

- `getUnreadCount` ở gateway và service → `GET /v1/notifications/unread-count` (trả một số nguyên).
- `useUnreadNotificationCount()`, key `['notifications', 'unread']` nằm dưới `NOTIFICATION_KEY` nên event realtime và các mutation đã đọc tự làm mới.
- `NotificationBell` dùng số từ BE; chưa tải xong thì tạm đếm theo danh sách đã có. Chuông chỉ render khi đã đăng nhập.

## 6. Sửa lỗi nhỏ

- `chat.service.ts`: `data.map(toChatThread)` truyền `index` vào tham số `myId`. Đổi thành `data.map((dto) => toChatThread(dto, myId))`.

## 7. Danh sách file thay đổi

| File | Nội dung |
| --- | --- |
| `post/components/PostForm.tsx` | Nút khi sửa, reset phường/xã |
| `pages/PostEditPage.tsx` | `fieldErrors`, toast cập nhật |
| `post/hooks/usePosts.ts` | `remove`, `usePostForAdmin`, `usePostDetail` có `isAdmin` |
| `pages/PostDetailPage.tsx` | `deleting`, `isAdmin`, `useMyApplicationsForPost` |
| `post/api/post.gateway.ts`, `post.service.ts` | `getByIdForAdmin`, `getPostByIdForAdmin` |
| `post/types/post.types.ts` | `AdminPostFilter` |
| `admin/hooks/useAdmin.ts` | `useAdminPosts`, `removePost` |
| `pages/admin/AdminPostsPage.tsx` | Danh sách thẻ, bộ lọc, cuộn tải thêm |
| `shared/components/ui/FilterSidebar.tsx` | Prop `hideProvince` |
| `application/api/application.gateway.ts`, `http.application.gateway.ts` | File mới |
| `application/service/application.service.ts` | Viết lại, không mock |
| `application/matchWarning.ts` | File mới |
| `application/types/application.dto.ts`, `application.types.ts` | `UserSummary`, `ranked`, `breakdown`, `proposedFee` |
| `application/hooks/useApplications.ts` | Import từ container, `useMyApplicationsForPost` |
| `application/components/ApplicantList.tsx`, `AiTop5Panel.tsx` | Dùng hook mới, ẩn khi `ranked = false` |
| `notification/realtime/NotificationRealtimeBinding.tsx` | File mới |
| `notification/api`, `service`, `hooks`, `components/NotificationBell.tsx` | Số chưa đọc |
| `main.tsx`, `config/di/container.ts` | Mount binding, đăng ký `applicationService` |
| `chat/service/chat.service.ts` | Sửa `map` |

## 8. Hạn chế đã biết

- `asTutor` vẫn gán cứng `averageRating`, `experienceYears` bằng 0 và `verificationStatus` là `PENDING`, vì BE chỉ trả tên và ảnh. `OfferList` hay `ApplicantRow` đọc các field này sẽ thấy giá trị rỗng.
- `/mine` giới hạn 100 đơn, không phân trang. Ai có hơn 100 đơn sẽ thiếu.
- Đơn thuộc bài mà `GET /v1/posts/{id}` không cho đọc bị bỏ qua cho đến khi BE thêm `post` rút gọn.
- Ngưỡng `RANK_MIN_PENDING = 3` chỉ để khớp bản mock cũ. BE chỉ chấm điểm khi có hơn 5 ứng viên, nên 3 đến 5 đơn vẫn bắn một request rồi ẩn khung.
- Ô lọc trạng thái ở admin chưa có tác dụng cho đến khi BE nhận `status`.

## 9. Kiểm thử

- [ ] Mở form sửa bài: phường/xã giữ nguyên, chỉ có nút «Lưu thay đổi», lỗi BE gắn đúng ô.
- [ ] Xóa bài nháp và bài đã đăng: không nháy «không tìm thấy», chuyển về danh sách bài của tôi.
- [ ] Admin: danh sách cuộn tải thêm, bộ lọc đứng yên khi cuộn, gỡ bài gọi API thật, bấm thẻ mở chi tiết cả bài nháp.
- [ ] Chủ bài mở bài có ứng viên: danh sách ứng viên và khung AI hiện đúng (cần hơn 5 ứng viên để có khung AI); cảnh báo hiện tiếng Việt.
- [ ] Chọn gia sư: hộp thoại đóng, không có toast lỗi, danh sách làm mới; bấm lại lần hai không xảy ra (đơn không còn `PENDING`).
- [ ] Gia sư mở «Đơn đã ứng tuyển» và `OfferList`: thấy đơn `ACCEPTED`, `PAID`, `FINISHED` (phụ thuộc BE thêm `post`).
- [ ] Hai tài khoản: tài khoản A tạo thông báo cho B, B thấy toast và số trên chuông tăng không cần tải lại.
- [ ] B có hơn 10 thông báo chưa đọc: số trên chuông hiện đúng tổng.

## 10. Cần gửi lại cho FE

- Nội dung `ApplicantRow.tsx` và `PayFeeModal.tsx`, để biết cần thêm field nào vào `UserSummary` và `post` rút gọn.
- `useAddressSelect.ts`, nếu phường/xã vẫn mất khi sửa bài.
- Response mẫu của `GET /v1/applications/mine` sau khi BE đổi DTO.
