"use client";

import { useState, useEffect } from "react";

/**
 * Smoothly counts up from 0 to `end` over `duration` ms.
 * Enterprise-grade cubic-bezier easing.
 */
export function useCountUp(end: number, duration = 250): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let raf: number;

    function step(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(elapsed / duration, 1);
      // cubic-bezier(.4,0,.2,1) approximation
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setValue(Math.round(eased * end));
      if (t < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return value;
}
