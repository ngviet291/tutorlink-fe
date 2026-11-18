# Fix: Revenue Statistics Query Logic

## 🐛 Vấn đề

**Hiện tượng:** Trang Admin Transactions gọi API thống kê doanh thu ngay khi load, trước khi chọn ngày.

**Lỗi Backend:**
```
400 Bad Request
"Invalid date range" hoặc NullPointerException
```

**Root Cause:** Lệch logic giữa FE và BE

### Frontend (useAdminPayments.ts:48)
```typescript
enabled:
  (!range.from && !range.to) ||  // ← Cho phép gọi khi CẢ HAI trống
  Boolean(range.from && range.to && range.from <= range.to),
```

**Nghĩa:** FE cho phép gọi API trong 2 trường hợp:
1. Cả 2 ngày đều trống → Gọi với `{}`
2. Cả 2 ngày đều có giá trị hợp lệ → Gọi với `{from, to}`

### Backend (PaymentServiceImpl.java:350)
```java
public RevenueStatisticsResponse getRevenueStatistics(LocalDate from, LocalDate to) {
    if (from == null || to == null || from.isAfter(to)) {
        throw new AppException(PaymentErrorCode.INVALID_DATE_RANGE);
    }
    // ...
}
```

**Nghĩa:** BE bắt buộc `from` và `to` không null → Reject request khi trống.

**Kết luận:** FE gọi API với `{}` → BE nhận `null, null` → Ném exception ❌

---

## ✅ Giải pháp

Theo **CLAUDE.md - Simplicity First**: Sửa FE để không gọi API khi chưa chọn ngày.

### File 1: useAdminPayments.ts

**Trước:**
```typescript
enabled:
  (!range.from && !range.to) ||
  Boolean(range.from && range.to && range.from <= range.to),
```

**Sau:**
```typescript
// Chỉ gọi API khi CẢ HAI ngày đều có giá trị
enabled: Boolean(range.from && range.to && range.from <= range.to),
```

### File 2: AdminTransactionsPage.tsx

**Thêm UI message khi chưa chọn ngày:**

**Trước:**
```tsx
{rangeInvalid ? (
  <p role="alert" className="text-sm text-danger">
    Chọn đủ hai ngày...
  </p>
) : revenue.isError ? (
  <ErrorState ... />
) : revenue.isLoading ? (
  <ListSkeleton rows={1} />
) : (
  // Hiển thị data
)}
```

**Sau:**
```tsx
{rangeInvalid ? (
  <p role="alert" className="text-sm text-danger">
    Chọn đủ hai ngày, ngày bắt đầu không sau ngày kết thúc.
  </p>
) : !from || !to ? (
  <p className="text-sm text-text-secondary">
    Vui lòng chọn khoảng thời gian để xem thống kê doanh thu.
  </p>
) : revenue.isError ? (
  <ErrorState onRetry={() => void revenue.refetch()} />
) : revenue.isLoading ? (
  <ListSkeleton rows={1} />
) : (
  revenue.data && (
    // Hiển thị data
  )
)}
```

---

## 🎯 Luồng hoạt động

### ❌ Trước khi fix:

```
1. User vào trang Admin Transactions
   ↓
2. Component render với from="", to=""
   ↓
3. useRevenueStatistics({ from: undefined, to: undefined })
   ↓
4. enabled = (!undefined && !undefined) = true ✓
   ↓
5. Gọi API getRevenueStatistics({})
   ↓
6. BE nhận from=null, to=null
   ↓
7. Throw INVALID_DATE_RANGE ❌
   ↓
8. FE hiển thị ErrorState
```

### ✅ Sau khi fix:

```
1. User vào trang Admin Transactions
   ↓
2. Component render với from="", to=""
   ↓
3. useRevenueStatistics({ from: undefined, to: undefined })
   ↓
4. enabled = Boolean(undefined && undefined) = false ✗
   ↓
5. KHÔNG gọi API
   ↓
6. FE hiển thị: "Vui lòng chọn khoảng thời gian..." ✓
   ↓
7. User chọn từ 2024-01-01 đến 2024-12-31
   ↓
8. enabled = Boolean("2024-01-01" && "2024-12-31" && true) = true ✓
   ↓
9. Gọi API getRevenueStatistics({ from: "2024-01-01", to: "2024-12-31" })
   ↓
10. BE xử lý thành công → Trả về thống kê ✓
```

---

## 📝 UX States

| State | Condition | Display |
|-------|-----------|---------|
| **Chưa chọn** | `!from \|\| !to` | "Vui lòng chọn khoảng thời gian..." |
| **Range invalid** | `from > to` | ⚠️ "Chọn đủ hai ngày, ngày bắt đầu không sau ngày kết thúc." (danger) |
| **Loading** | Query enabled + fetching | `<ListSkeleton />` |
| **Error** | Query error | `<ErrorState />` với retry button |
| **Success** | Query success | Hiển thị grid thống kê |

---

## 🧪 Testing

### Test Case 1: Load trang lần đầu
1. Vào `/admin/transactions`
2. **Expected:** Hiển thị "Vui lòng chọn khoảng thời gian..."
3. **NOT:** Gọi API hoặc hiển thị error

### Test Case 2: Chọn chỉ 1 ngày
1. Chọn "Từ ngày" = 2024-01-01
2. Để trống "Đến ngày"
3. **Expected:** Hiển thị warning "Chọn đủ hai ngày..."
4. **NOT:** Gọi API

### Test Case 3: Chọn range hợp lệ
1. Chọn "Từ ngày" = 2024-01-01
2. Chọn "Đến ngày" = 2024-12-31
3. **Expected:** 
   - Loading skeleton hiển thị
   - Gọi API với params đúng
   - Hiển thị grid thống kê

### Test Case 4: Chọn range ngược
1. Chọn "Từ ngày" = 2024-12-31
2. Chọn "Đến ngày" = 2024-01-01
3. **Expected:** Hiển thị warning "ngày bắt đầu không sau ngày kết thúc"
4. **NOT:** Gọi API

### Test Case 5: Xóa ngày sau khi đã chọn
1. Chọn range hợp lệ → Thấy thống kê
2. Xóa "Từ ngày" hoặc "Đến ngày"
3. **Expected:** Quay lại "Vui lòng chọn khoảng thời gian..."

---

## 📊 Files Changed

### Frontend (2 files):
1. **useAdminPayments.ts** (line 48)
   - Sửa `enabled` logic: Chỉ cho phép gọi khi cả 2 ngày đều có giá trị

2. **AdminTransactionsPage.tsx** (line 78-86)
   - Thêm state kiểm tra `!from || !to`
   - Hiển thị message yêu cầu chọn ngày

### Backend:
- ✅ **Không thay đổi** - Giữ nguyên validation bắt buộc from/to
- Lý do: BE đúng theo business rule, FE phải validate trước khi gọi

---

## 💡 Tradeoffs và Alternatives

### Option A: Sửa FE (Đã chọn) ✅
**Ưu điểm:**
- Đơn giản, surgical change (2 files, < 10 lines)
- Không phá vỡ BE contract
- UX tốt hơn: User biết cần làm gì

**Nhược điểm:**
- Không có

### Option B: Sửa BE cho phép null
**Ưu điểm:**
- FE không cần sửa

**Nhược điểm:**
- Phức tạp: Phải quyết định default range (30 ngày? tất cả?)
- Vi phạm business rule: Admin nên chọn range rõ ràng
- Tốn performance: Query không có range có thể chậm

### Option C: FE set default range
**Ưu điểm:**
- Auto-load data khi vào trang

**Nhược điểm:**
- User không kiểm soát được range ban đầu
- Có thể gây nhầm lẫn: Thống kê của khoảng nào?

---

## 🔍 Bằng chứng lệch

### FE: tutorlink-fe/src/features/admin/hooks/useAdminPayments.ts:48
```typescript
enabled:
  (!range.from && !range.to) ||  // ← CHO PHÉP GỌI KHI TRỐNG
  Boolean(range.from && range.to && range.from <= range.to),
```

### BE: tutorlink-be/src/.../PaymentServiceImpl.java:350
```java
public RevenueStatisticsResponse getRevenueStatistics(LocalDate from, LocalDate to) {
    if (from == null || to == null || from.isAfter(to)) {
        throw new AppException(PaymentErrorCode.INVALID_DATE_RANGE);  // ← BẮT BUỘC KHÔNG NULL
    }
```

**Kết luận:** Đã xác minh lệch giữa FE và BE trong mã nguồn.

---

**Ngày:** 2026-11-16  
**Tác giả:** Kiro Agent  
**Tuân thủ:** AGENTS.md (Surgical Changes) + CLAUDE.md (Simplicity First)  
**Impact:** Low risk, UI-only changes, BE validation giữ nguyên
