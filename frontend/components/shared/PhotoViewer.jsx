"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * PhotoViewer — reusable lightbox / photo viewer
 *
 * Props:
 *   images      – Array of { url: string, alt?: string }
 *   startIndex  – Which image to show first (default 0)
 *   isOpen      – Controlled open state
 *   onClose     – Callback to close the viewer
 */
export default function PhotoViewer({ images = [], startIndex = 0, isOpen, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const total = images.length;
  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  // Portal mount guard (SSR-safe)
  useEffect(() => { setMounted(true); }, []);

  // Sync startIndex when viewer opens
  useEffect(() => {
    if (isOpen) {
      setCurrent(startIndex);
      setZoomed(false);
      setImageLoaded(false);
    }
  }, [isOpen, startIndex]);

  // Reset loaded flag on image change
  useEffect(() => { setImageLoaded(false); }, [current]);

  const prev = useCallback(() => {
    if (hasPrev) { setCurrent(c => c - 1); setZoomed(false); }
  }, [hasPrev]);

  const next = useCallback(() => {
    if (hasNext) { setCurrent(c => c + 1); setZoomed(false); }
  }, [hasNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, prev, next, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Touch handlers for swipe navigation
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Download current image
  const handleDownload = async () => {
    if (downloading) return;
    const currentImg = images[current];
    if (!currentImg) return;
    setDownloading(true);
    try {
      const response = await fetch(currentImg.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      // Derive a filename from the URL or fallback
      const urlParts = currentImg.url.split("/");
      const rawName = urlParts[urlParts.length - 1].split("?")[0];
      a.download = rawName || `photo-${current + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(currentImg.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  if (!mounted || !isOpen || total === 0) return null;

  const img = images[current];

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ animation: "photoViewerFadeIn 0.2s ease both" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* --- Controls layer --- */}

      {/* Top-right action buttons */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Download button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          disabled={downloading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all disabled:opacity-60"
          aria-label="Download image"
          title="Download image"
        >
          {downloading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
          aria-label="Close photo viewer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Counter pill */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-4 py-1.5 border border-white/10">
          <span className="text-[13px] font-bold text-white">{current + 1}</span>
          <span className="text-[12px] text-white/50">/</span>
          <span className="text-[13px] font-medium text-white/70">{total}</span>
        </div>
      )}

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:scale-105 transition-all"
          aria-label="Previous image"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:scale-105 transition-all"
          aria-label="Next image"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {total > 1 && total <= 10 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); setZoomed(false); }}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-5 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute bottom-5 right-4 z-20 text-[11px] text-white/40 font-medium select-none hidden sm:block">
        {zoomed ? "Click to zoom out" : "Click to zoom in"}
      </div>

      {/* --- Image --- */}
      <div
        className="relative z-10 flex items-center justify-center max-w-[90vw] max-h-[90vh] select-none"
        style={{ animation: "photoViewerScaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
        key={current}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        <img
          src={img.url}
          alt={img.alt || "Photo"}
          onLoad={() => setImageLoaded(true)}
          onClick={() => setZoomed(z => !z)}
          className="block rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] transition-all duration-300"
          style={{
            maxWidth: zoomed ? "min(96vw, 1400px)" : "min(88vw, 900px)",
            maxHeight: zoomed ? "95vh" : "82vh",
            objectFit: "contain",
            cursor: zoomed ? "zoom-out" : "zoom-in",
            opacity: imageLoaded ? 1 : 0,
          }}
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes photoViewerFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes photoViewerScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
