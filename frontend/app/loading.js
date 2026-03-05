"use client";

import { useEffect } from "react";

const LOADING_START_EVENT = "hsc:route-loading-start";
const LOADING_END_EVENT = "hsc:route-loading-end";
const GLOBAL_LOADING_COUNT_KEY = "__hscRouteLoadingCount";

export default function Loading() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const previous = Number(window[GLOBAL_LOADING_COUNT_KEY] || 0);
    const next = previous + 1;
    window[GLOBAL_LOADING_COUNT_KEY] = next;

    if (previous === 0) {
      window.dispatchEvent(new CustomEvent(LOADING_START_EVENT));
    }

    return () => {
      const current = Number(window[GLOBAL_LOADING_COUNT_KEY] || 0);
      const updated = Math.max(0, current - 1);
      window[GLOBAL_LOADING_COUNT_KEY] = updated;

      if (updated === 0) {
        window.dispatchEvent(new CustomEvent(LOADING_END_EVENT));
      }
    };
  }, []);

  return null;
}
