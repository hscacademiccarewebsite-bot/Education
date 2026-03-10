"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const COMPLETE_DELAY_MS = 350;
const TRICKLE_INTERVAL_MS = 150;
const SAFETY_TIMEOUT_MS = 20000;
const LOADING_START_EVENT = "hsc:route-loading-start";
const LOADING_END_EVENT = "hsc:route-loading-end";

// Paths that should NOT be counted as "data" requests for completion gating.
// Adjust if you have analytics, beacon endpoints, etc.
const IGNORED_URL_PATTERNS = [
  /\/_next\//,
  /\/favicon/,
  /\/__nextjs/,
];

function isTrackedRequest(url) {
  try {
    const u = new URL(url, window.location.href);
    if (u.origin !== window.location.origin) return false; // same-origin only
    return !IGNORED_URL_PATTERNS.some((re) => re.test(u.pathname));
  } catch {
    return false;
  }
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isRouteChangeTarget(url) {
  const current = new URL(window.location.href);
  if (url.origin !== current.origin) {
    return false;
  }
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
  const pendingFetchRef = useRef(0); // ← tracks in-flight fetch/XHR count

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
    if (!activeRef.current) return;

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
      completeTimerRef.current = null;
    }, COMPLETE_DELAY_MS);
  };

  // Only completes when: route committed + loading.js done + NO pending requests.
  const tryCompleteAfterPaint = () => {
    if (!activeRef.current) return;
    if (!routeCommittedRef.current) return;
    if (loadingFallbackActiveRef.current) return;
    if (pendingFetchRef.current > 0) return; // ← wait for data
    if (raf1Ref.current || raf2Ref.current) return;

    raf1Ref.current = requestAnimationFrame(() => {
      raf1Ref.current = null;
      raf2Ref.current = requestAnimationFrame(() => {
        raf2Ref.current = null;
        forceComplete();
      });
    });
  };

  const startLoaderNow = () => {
    if (activeRef.current) return;

    routeCommittedRef.current = false;
    loadingFallbackActiveRef.current = false;
    activeRef.current = true;

    setActive(true);
    setProgress(10);

    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const bump = Math.max(1, Math.round((100 - prev) * 0.07));
        return Math.min(90, prev + bump);
      });
    }, TRICKLE_INTERVAL_MS);

    safetyTimerRef.current = setTimeout(() => {
      forceComplete();
    }, SAFETY_TIMEOUT_MS);
  };

  const scheduleStartLoader = () => {
    if (activeRef.current || queuedStartRef.current) return;
    queuedStartRef.current = setTimeout(() => {
      queuedStartRef.current = null;
      startLoaderNow();
    }, 0);
  };

  // ─── React to route change commit ──────────────────────────────────────────
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

  // ─── Patch fetch + XHR and wire navigation events ──────────────────────────
  useEffect(() => {
    // ── fetch interception ──
    const originalFetch = window.fetch;

    window.fetch = function patchedFetch(input, init) {
      const url = typeof input === "string" ? input : input?.url ?? "";
      const track = isTrackedRequest(url);

      if (track) {
        pendingFetchRef.current += 1;
      }

      return originalFetch.call(this, input, init).finally(() => {
        if (track) {
          pendingFetchRef.current = Math.max(0, pendingFetchRef.current - 1);
          // Give React one scheduler tick to handle state from the response.
          setTimeout(() => tryCompleteAfterPaint(), 0);
        }
      });
    };

    // ── XHR interception ──
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
      this.__hscTrack = isTrackedRequest(String(url));
      return originalXHROpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function patchedSend(...args) {
      if (this.__hscTrack) {
        pendingFetchRef.current += 1;

        const onDone = () => {
          pendingFetchRef.current = Math.max(0, pendingFetchRef.current - 1);
          setTimeout(() => tryCompleteAfterPaint(), 0);
          this.removeEventListener("loadend", onDone);
        };
        this.addEventListener("loadend", onDone);
      }
      return originalXHRSend.apply(this, args);
    };

    // ── navigation event wiring ──
    const onDocumentClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return;

      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      )
        return;

      try {
        const url = new URL(href, window.location.href);
        if (isRouteChangeTarget(url)) scheduleStartLoader();
      } catch {
        // malformed URL – ignore
      }
    };

    const onPopState = () => scheduleStartLoader();

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
          if (isRouteChangeTarget(target)) scheduleStartLoader();
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
          if (isRouteChangeTarget(target)) scheduleStartLoader();
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
      // Restore originals
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;

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
    <>
      {/* ── YouTube-style top progress bar ── */}
      <div
        role="progressbar"
        aria-hidden="true"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          zIndex: 9999,
          pointerEvents: "none",
          opacity: active ? 1 : 0,
          transition: "opacity 250ms ease",
        }}
      >
        {/* Bar track */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "left center",
            transform: `scaleX(${progress / 100})`,
            transition:
              progress === 0
                ? "none"
                : "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)",
            background:
              "linear-gradient(90deg, #147b79 0%, #1a9b93 45%, #1a6078 100%)",
            boxShadow:
              "0 0 10px rgba(20,123,121,0.7), 0 0 20px rgba(20,123,121,0.4)",
          }}
        >
          {/* Shimmer sweep */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: active ? "hsc-bar-shimmer 1.4s linear infinite" : "none",
            }}
          />
        </div>

        {/* Leading-edge glow dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${progress}%`,
            transform: "translate(-50%, -50%)",
            width: "6px",
            height: "6px",
            borderRadius: "9999px",
            background: "#d4a85c",
            boxShadow:
              "0 0 6px 2px rgba(212,168,92,0.9), 0 0 14px 4px rgba(20,123,121,0.6)",
            opacity: active && progress > 3 && progress < 98 ? 1 : 0,
            transition:
              "opacity 150ms ease, left 220ms cubic-bezier(0.25,1,0.5,1)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}
