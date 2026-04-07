import { useRef, useEffect, useCallback } from "react";

interface SwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    tracking.current = true;
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!tracking.current || !enabled) return;
    tracking.current = false;

    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;

    if (dx > 0) onSwipeRight();
    else onSwipeLeft();
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
