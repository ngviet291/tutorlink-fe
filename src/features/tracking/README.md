# Tracking System

Hệ thống tracking events cho TutorLink Frontend.

## 🎯 Tính năng

- ✅ Track 7 loại sự kiện theo spec
- ✅ Batch events (gửi hàng loạt mỗi 5 phút hoặc khi đạt 50 events)
- ✅ Tự động track `page_view` và `client_error`
- ✅ Hỗ trợ Google Analytics song song
- ✅ Không cần đăng nhập (dùng `publicHttp`)

## 📋 Danh sách Events

| Event | Khi nào | Props |
|-------|---------|-------|
| `page_view` | Đổi route (tự động) | `path`, `referrer` |
| `application_list_opened` | Mở danh sách ứng viên | `postId`, `applicantCount`, `ranked` |
| `tutor_profile_viewed` | Xem hồ sơ gia sư | `tutorId`, `section`, `rank`, `dwellMs` |
| `tutor_favorited` | Bấm yêu thích | `tutorId`, `source` |
| `search_performed` | Tìm kiếm/lọc | `query`, `filters`, `resultCount` |
| `post_form_step` | Mỗi bước form đăng bài | `step`, `status` |
| `client_error` | Lỗi JavaScript (tự động) | `message`, `path` |

## 🚀 Cách sử dụng

### 1. Track event đơn giản

```typescript
import { track } from '@/features/tracking'

// Track khi user favorite gia sư
track('tutor_favorited', {
  tutorId: '123',
  source: 'search'
})
```

### 2. Sử dụng hook trong React component

```typescript
import { useTracking } from '@/features/tracking'

function MyComponent() {
  const trackEvent = useTracking()
  
  const handleClick = () => {
    trackEvent('tutor_favorited', {
      tutorId: '123',
      source: 'profile'
    })
  }
  
  return <button onClick={handleClick}>Yêu thích</button>
}
```

### 3. Track thời gian xem (dwell time)

```typescript
import { useDwellTracking } from '@/features/tracking'

function TutorProfile({ tutorId }: { tutorId: string }) {
  // Tự động track khi component unmount
  useDwellTracking('tutor_profile_viewed', {
    tutorId,
    section: 'TOP',
    rank: 1
  })
  
  return <div>Profile content...</div>
}
```

## 📁 Cấu trúc files

```
src/features/tracking/
├── types/
│   └── tracking.types.ts       # TypeScript types
├── service/
│   └── tracking.service.ts     # API service (publicHttp)
├── tracker.ts                  # Core tracking logic
├── hooks.ts                    # React hooks
├── index.ts                    # Public exports
└── README.md                   # Documentation
```

## 🔧 Đã implement tracking ở đâu?

| Component/File | Event | Ghi chú |
|----------------|-------|---------|
| `tracker.ts` | `page_view` | Tự động track mỗi lần đổi route |
| `tracker.ts` | `client_error` | Tự động track lỗi JS |
| `TutorDetailPage.tsx` | `tutor_profile_viewed` | Track với dwell time khi unmount |
| `useFavorites.ts` | `tutor_favorited` | Track khi toggle favorite thành công |
| `ApplicantList.tsx` | `application_list_opened` | Track khi danh sách ứng viên load xong |
| `FilterSidebar.tsx` | `search_performed` | Track khi user thay đổi filter |
| `PostForm.tsx` | `post_form_step` | Track khi mở form và khi submit |

## ⚙️ Cấu hình

Trong file `.env`:

```bash
# Bật/tắt tracking
VITE_TRACKING_ENABLED=true

# Google Analytics ID (optional)
VITE_GA_ID=G-XXXXXXXXXX

# Thời gian flush (giây, mặc định 300 = 5 phút)
VITE_TRACKING_FLUSH_SECONDS=300
```

## 🧪 Test

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Mở web và thực hiện các hành động:**
   - Chuyển trang → `page_view`
   - Xem profile gia sư → `tutor_profile_viewed`
   - Bấm yêu thích → `tutor_favorited`
   - Mở danh sách ứng viên → `application_list_opened`
   - Tìm kiếm/lọc → `search_performed`
   - Mở form đăng bài → `post_form_step`
   - Gõ `throw new Error('test')` trong Console → `client_error`

3. **Kiểm tra Network tab (F12):**
   - Filter: `tracking`
   - Xem request `POST /api/v1/tracking/events`
   - Check payload có đúng format không

## 📊 Payload mẫu

```json
{
  "anonId": "7b1e4c52-0d1a-4f6e-9c3a-2a8f5e1b9d00",
  "sessionId": "c3a9f0d4-61b7-4e2c-8f55-9d3b7a6e1c21",
  "events": [
    {
      "name": "tutor_profile_viewed",
      "ts": "2026-11-03T10:15:30.123Z",
      "props": {
        "tutorId": "123",
        "section": "TOP",
        "rank": 2,
        "dwellMs": 8400
      }
    }
  ]
}
```

## 🔍 Debug

Xem console logs:
- `[API] POST /v1/tracking/events`
- `[JWT] Token missing` (OK, vì dùng publicHttp)
- `[BODY] {...}`

## ❗ Troubleshooting

**Q: API trả về 401?**
A: Kiểm tra đã đổi từ `http` sang `publicHttp` trong `tracking.service.ts` chưa.

**Q: Events không được gửi?**
A: Kiểm tra `VITE_TRACKING_ENABLED=true` trong `.env`.

**Q: Muốn gửi ngay lập tức thay vì đợi 5 phút?**
A: Gọi `flush()` hoặc reload trang (tự động flush khi unload).

```typescript
import { flush } from '@/features/tracking'
await flush()
```
