import { useState, useEffect, useRef } from "react";

/**
 * Ensures a loading state stays visible for at least `minMs` milliseconds.
 * This prevents skeleton loaders from flashing too quickly to see.
 *
 * Usage:
 *   const loading = useMinLoading(isLoading, 800);
 *   // `loading` stays true for at least 800ms even if `isLoading` becomes false sooner
 */
export function useMinLoading(isLoading: boolean, minMs = 800): boolean {
  const [minLoading, setMinLoading] = useState(isLoading);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      startTime.current = Date.now();
      setMinLoading(true);
    } else {
      const elapsed = Date.now() - startTime.current;
      if (elapsed >= minMs) {
        setMinLoading(false);
      } else {
        const remaining = minMs - elapsed;
        const timer = setTimeout(() => setMinLoading(false), remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minMs]);

  return minLoading;
}
