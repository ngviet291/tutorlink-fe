import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Tên tham số URL dùng chung: ?highlight=<id> (vd. /tutor/123?tab=reviews&highlight=abc). */
export const HIGHLIGHT_PARAM = "highlight";

/** Đọc id cần làm nổi từ URL. */
export function useHighlightParam(): string | undefined {
  const [searchParams] = useSearchParams();
  return searchParams.get(HIGHLIGHT_PARAM) ?? undefined;
}

/**
 * Cuộn tới và làm nổi một mục trong danh sách (đánh giá, bài đăng, đơn ứng tuyển...).
 *
 * Cách dùng:
 *   const highlightId = useHighlightParam();
 *   const { ref, isHighlighted, flashing } = useHighlight<HTMLLIElement>(highlightId);
 *   items.map((it) => (
 *     <li key={it.id} ref={isHighlighted(it.id) ? ref : undefined}
 *         className={isHighlighted(it.id) ? (flashing ? "ring-2 bg-primary-light" : "ring-2") : ""} />
 *   ))
 *
 * `ready`: truyền false khi dữ liệu chưa tải xong để chưa cuộn.
 */
export function useHighlight<T extends HTMLElement = HTMLElement>(
  highlightId: string | undefined,
  ready = true,
  flashMs = 4000,
) {
  const ref = useRef<T>(null);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!highlightId || !ready) return;
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), flashMs);
    return () => window.clearTimeout(timer);
  }, [highlightId, ready, flashMs]);

  return {
    ref,
    flashing,
    isHighlighted: (id: string) => Boolean(highlightId) && id === highlightId,
  };
}