"use client";

import { useEffect, useRef } from "react";

/** Keeps a scroll container pinned to the bottom unless the user scrolled up. */
export function useAutoScroll<T>(dep: T, resetKey?: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    stick.current = true;
  }, [resetKey]);

  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [dep, resetKey]);

  // Media loads change height after render; keep pinned while sticking.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    };
    el.addEventListener("load", onLoad, true);
    el.addEventListener("loadedmetadata", onLoad, true);
    return () => {
      el.removeEventListener("load", onLoad, true);
      el.removeEventListener("loadedmetadata", onLoad, true);
    };
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  const pin = () => {
    stick.current = true;
  };
  return { ref, onScroll, pin };
}
