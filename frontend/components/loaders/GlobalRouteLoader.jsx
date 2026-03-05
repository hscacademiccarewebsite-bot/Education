"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const COMPLETE_DELAY_MS = 220;
const TRICKLE_INTERVAL_MS = 150;
const SAFETY_TIMEOUT_MS = 20000;
const LOADING_START_EVENT = "hsc:route-loading-start";
const LOADING_END_EVENT = "hsc:route-loading-end";

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isRouteChangeTarget(url) {
  const current = new URL(window.location.href);
  if (url.origin !== current.origin) {
    return false;
  }

  // Ignore hash-only jumps.
  if (url.pathname === current.pathname && url.search === current.search) {
    return false;
  }

  return true;
}

export default function GlobalRouteLoader() {
  const pathname = usePathname();
  const routeKey = useMemo(() => pathname || "", [pathname]);

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const mountedRef = useRef(false);
  const activeRef = useRef(false);
  const queuedStartRef = useRef(null);
  const routeCommittedRef = useRef(false);
  const loadingFallbackActiveRef = useRef(false);

  const completeTimerRef = useRef(null);
  const trickleTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);
  const raf1Ref = useRef(null);
  const raf2Ref = useRef(null);

  const clearTimers = () => {
    if (queuedStartRef.current) {
      clearTimeout(queuedStartRef.current);
      queuedStartRef.current = null;
    }

    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }

    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }

    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    if (raf1Ref.current) {
      cancelAnimationFrame(raf1Ref.current);
      raf1Ref.current = null;
    }

    if (raf2Ref.current) {
      cancelAnimationFrame(raf2Ref.current);
      raf2Ref.current = null;
    }
  };

  const forceComplete = () => {
    if (!activeRef.current) {
      return;
    }

    activeRef.current = false;
    setProgress(100);

    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    completeTimerRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    }, COMPLETE_DELAY_MS);
  };

  const tryCompleteAfterPaint = () => {
    if (!activeRef.current) {
      return;
    }
    if (!routeCommittedRef.current) {
      return;
    }
    if (loadingFallbackActiveRef.current) {
      return;
    }
    if (raf1Ref.current || raf2Ref.current) {
      return;
    }

    raf1Ref.current = requestAnimationFrame(() => {
      raf1Ref.current = null;
      raf2Ref.current = requestAnimationFrame(() => {
        raf2Ref.current = null;
        forceComplete();
      });
    });
  };

  const startLoaderNow = () => {
    if (activeRef.current) {
      return;
    }

    routeCommittedRef.current = false;
    loadingFallbackActiveRef.current = false;
    activeRef.current = true;

    setActive(true);
    setProgress(10);

    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          return prev;
        }
        const next = prev + Math.max(1, Math.round((100 - prev) * 0.08));
        return Math.min(92, next);
      });
    }, TRICKLE_INTERVAL_MS);

    safetyTimerRef.current = setTimeout(() => {
      forceComplete();
    }, SAFETY_TIMEOUT_MS);
  };

  const scheduleStartLoader = () => {
    if (activeRef.current || queuedStartRef.current) {
      return;
    }

    queuedStartRef.current = setTimeout(() => {
      queuedStartRef.current = null;
      startLoaderNow();
    }, 0);
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return undefined;
    }

    if (queuedStartRef.current) {
      clearTimeout(queuedStartRef.current);
      queuedStartRef.current = null;
    }

    routeCommittedRef.current = true;
    tryCompleteAfterPaint();

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") {
        return;
      }
      if (anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (isRouteChangeTarget(url)) {
          scheduleStartLoader();
        }
      } catch {
        // Ignore malformed URLs.
      }
    };

    const onPopState = () => {
      scheduleStartLoader();
    };

    const onLoadingStart = () => {
      loadingFallbackActiveRef.current = true;
    };

    const onLoadingEnd = () => {
      loadingFallbackActiveRef.current = false;
      tryCompleteAfterPaint();
    };

    const { pushState, replaceState } = window.history;

    window.history.pushState = function patchedPushState(state, title, url) {
      if (url) {
        try {
          const target = new URL(String(url), window.location.href);
          if (isRouteChangeTarget(target)) {
            scheduleStartLoader();
          }
        } catch {
          scheduleStartLoader();
        }
      } else {
        scheduleStartLoader();
      }

      return pushState.call(this, state, title, url);
    };

    window.history.replaceState = function patchedReplaceState(state, title, url) {
      if (url) {
        try {
          const target = new URL(String(url), window.location.href);
          if (isRouteChangeTarget(target)) {
            scheduleStartLoader();
          }
        } catch {
          scheduleStartLoader();
        }
      } else {
        scheduleStartLoader();
      }

      return replaceState.call(this, state, title, url);
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(LOADING_START_EVENT, onLoadingStart);
    window.addEventListener(LOADING_END_EVENT, onLoadingEnd);

    return () => {
      clearTimers();
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(LOADING_START_EVENT, onLoadingStart);
      window.removeEventListener(LOADING_END_EVENT, onLoadingEnd);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 top-0 z-[70] h-1 bg-transparent transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 shadow-[0_0_18px_rgba(16,185,129,0.85)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
