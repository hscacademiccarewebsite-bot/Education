"use client";

export default function AuthSkeleton() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      {/* Logo mark pulse */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer ring pulse */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20" />
        {/* Inner ring */}
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-100 bg-white shadow-[0_4px_14px_rgba(16,185,129,0.15)]">
          <svg
            className="h-5 w-5 animate-spin text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-bold text-slate-700">Verifying session</p>
        <p className="text-xs text-slate-400">Just a moment…</p>
      </div>

      {/* Dot trail */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
