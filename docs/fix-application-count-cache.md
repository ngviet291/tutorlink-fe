# Fix: Frontend không cập nhật số lượt đăng ký

## Vấn đề

- ✅ Backend API trả về `applicationCount` đúng
- ✅ Database có dữ liệu applications
- ❌ Frontend vẫn hiển thị 0

**Nguyên nhân:** TanStack Query đang dùng **cache cũ** (trước khi thêm field `applicationCount`)

## Giải pháp

### 1. Thêm `applicationCount` vào Type Definition ✅

**File:** `src/features/post/types/post.dto.ts`

```typescript
export interface PostResponse {
  id: string;
  title: string;
  // ...
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;  // ← ĐÃ THÊM
}
```

### 2. Set `staleTime: 0` để không dùng cache ✅

**File:** `src/features/admin/hooks/useAdmin.ts`

```typescript
export function useAdminPosts(filter: Omit<AdminPostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: [...adminKeys.posts, "list", filter],
    queryFn: ({ pageParam }) =>
      postService.getAdminPosts({
        ...filter,
        status: filter.status || undefined,
        cursor: pageParam,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
    staleTime: 0, // ← ĐÃ THÊM: Luôn fetch mới
  });
}
```

### 3. Clear Browser Cache

#### Option A: Hard Refresh (Nhanh nhất)
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### Option B: DevTools
1. F12 → Tab **Application**
2. **Storage** → **Clear site data**
3. Reload page

#### Option C: Console
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 4. Restart Dev Server (Nếu cần)

```bash
cd tutorlink-fe

# Stop (Ctrl+C) rồi start lại
npm run dev
```

## Kiểm tra

### 1. Xem Network Tab
F12 → Network → Gọi API `/v1/admin/posts`

**Response phải có:**
```json
{
  "content": [
    {
      "id": "xxx",
      "title": "...",
      "applicationCount": 3  ← Phải có và > 0
    }
  ]
}
```

### 2. Xem React DevTools
Nếu cài React DevTools:
- Mở Components tab
- Tìm `AdminPostsPage`
- Xem props của PostCard → `post.applicationCount` phải có giá trị

### 3. Console log
Thêm log tạm vào `AdminPostsPage.tsx`:

```tsx
useEffect(() => {
  console.log("Posts data:", posts);
  posts.forEach(post => {
    console.log(`Post ${post.id}:`, post.applicationCount);
  });
}, [posts]);
```

**Phải thấy:**
```
Post xxx: 3
Post yyy: 1
Post zzz: 0
```

## Troubleshooting

### Issue 1: Vẫn hiển thị 0 sau khi clear cache

**Kiểm tra:**
```tsx
// AdminPostsPage.tsx line ~244
<Button>
  Lượt đăng ký ({post.applicationCount ?? 0})
</Button>
```

**Debug:**
```tsx
<Button>
  Lượt đăng ký ({console.log("Count:", post.applicationCount) || post.applicationCount ?? 0})
</Button>
```

Xem console log → Nếu `undefined` → type chưa được cập nhật hoặc mapper bỏ qua field

### Issue 2: TypeScript error

```
Property 'applicationCount' does not exist on type 'PostResponse'
```

**Nguyên nhân:** File `post.types.ts` hoặc `post.dto.ts` chưa có field

**Giải pháp:**
1. Thêm `applicationCount?: number;` vào type
2. Restart TypeScript server (VSCode: Cmd/Ctrl+Shift+P → "Restart TS Server")

### Issue 3: Data không update realtime

**Hiện tượng:** Phải refresh page mới thấy số mới

**Nguyên nhân:** TanStack Query đang cache

**Giải pháp:** Đã set `staleTime: 0` → luôn fetch mới mỗi khi component mount

**Nếu muốn auto-refetch định kỳ:**
```typescript
export function useAdminPosts(filter: Omit<AdminPostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    // ...
    staleTime: 0,
    refetchInterval: 30000, // Auto refetch mỗi 30 giây
  });
}
```

## Test Cases

### ✅ Case 1: Bài có 3 ứng tuyển
- Hiển thị: "Lượt đăng ký (3)"
- Click vào → Modal show 3 người

### ✅ Case 2: Bài có 0 ứng tuyển
- Hiển thị: "Lượt đăng ký (0)"
- Click vào → Modal show "Chưa có lượt đăng ký"

### ✅ Case 3: Bài mới, chưa có người ứng tuyển
- Hiển thị: "Lượt đăng ký (0)"
- Backend trả: `applicationCount: 0`

### ✅ Case 4: Sau khi có người ứng tuyển mới
- Refresh page → Số tăng lên
- Không cần clear cache (vì đã set `staleTime: 0`)

## Summary

| Component | Status | Action |
|-----------|--------|--------|
| Backend API | ✅ OK | Trả về `applicationCount` đúng |
| Type Definition | ✅ Fixed | Thêm `applicationCount?: number` |
| Query Hook | ✅ Fixed | Set `staleTime: 0` |
| Browser Cache | ⚠️ Need Clear | Hard refresh (Ctrl+Shift+R) |
| UI Display | ✅ OK | `{post.applicationCount ?? 0}` |

---

**Sau khi làm xong 3 bước trên + clear cache, frontend sẽ hiển thị đúng số lượt đăng ký!**
