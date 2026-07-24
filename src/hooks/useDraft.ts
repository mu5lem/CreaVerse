import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persist an input value in localStorage across tab-switch / refresh / remount.
 *
 * Fixes prior bug: the initial render always used the `initial` prop, then a
 * later effect loaded from localStorage — parents that re-mounted (e.g. when
 * `user` changed and the key changed) would flash empty. Now we read
 * synchronously via a lazy useState initializer (client-safe with SSR guard).
 */
export function useDraft(key: string, initial: string = "") {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = window.localStorage.getItem(key);
      return saved ?? initial;
    } catch {
      return initial;
    }
  });
  const currentKey = useRef(key);

  // If the key changes (e.g. user id becomes available), reload from that key.
  useEffect(() => {
    if (currentKey.current === key) return;
    currentKey.current = key;
    try {
      const saved = window.localStorage.getItem(key);
      setValue(saved ?? initial);
    } catch {
      /* ignore */
    }
  }, [key, initial]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        if (value) window.localStorage.setItem(key, value);
        else window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [key, value]);

  const clear = useCallback(() => {
    setValue("");
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return [value, setValue, clear] as const;
}
