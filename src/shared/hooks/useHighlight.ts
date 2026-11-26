import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

/** Tên tham số URL dùng chung: ?highlight=<id> */
export const HIGHLIGHT_PARAM = "highlight";

/** Đọc id cần làm nổi từ URL. */
export function useHighlightParam(): string | undefined {
  const [searchParams] = useSearchParams();
  return searchParams.get(HIGHLIGHT_PARAM) ?? undefined;
}

/**
 * Cuộn tới và làm nổi một mục trong danh sách
 * (đánh giá, bài đăng, đơn ứng tuyển, cuộc trò chuyện...).
 */
export function useHighlight<T extends HTMLElement = HTMLElement>(
  highlightId: string | undefined,
  ready = true,
  flashMs = 4000,
) {
  const ref = useRef<T>(null);
  const [flashing, setFlashing] = useState(false);

  // location.key giúp hook nhận biết mỗi lần điều hướng tới route.
  const location = useLocation();

  useEffect(() => {
    if (!highlightId || !ready) return;

    const element = ref.current;

    if (!element) return;

    element.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });

    setFlashing(true);

    const timer = window.setTimeout(() => {
      setFlashing(false);
    }, flashMs);

    return () => {
      window.clearTimeout(timer);
      setFlashing(false);
    };
  }, [highlightId, ready, flashMs, location.key]);

  return {
    ref,

    flashing,

    isHighlighted: (id: string) => Boolean(highlightId) && id === highlightId,
  };
}
