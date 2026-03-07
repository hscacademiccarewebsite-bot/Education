"use client";

export default function AuthSkeleton() {
  return (
    <div className="container-page py-10" role="status" aria-live="polite">
      <div className="mx-auto max-w-4xl">
        {/* Shimmering Header */}
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-[14px] border border-slate-300 bg-slate-200 shadow-[0_6px_14px_rgba(15,23,42,0.11)]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* Shimmering Body Sections */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative h-64 overflow-hidden rounded-[14px] border border-slate-300 bg-white p-6 shadow-[0_6px_14px_rgba(15,23,42,0.11)]">
              <div className="mb-4 h-4 w-1/2 rounded-full bg-slate-100" />
              <div className="mb-2 h-3 w-full rounded-full bg-slate-50" />
              <div className="mb-2 h-3 w-5/6 rounded-full bg-slate-50" />
              <div className="mt-auto h-8 w-1/3 rounded-lg bg-slate-100" />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-sm font-bold text-slate-600">Verifying session...</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
