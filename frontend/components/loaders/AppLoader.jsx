"use client";

function Spinner({ size = "md" }) {
  const sizeClass =
    size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-[3px]" : "h-6 w-6 border-[3px]";

  return (
    <span
      className={`${sizeClass} inline-block animate-spin rounded-full border-emerald-600 border-t-transparent`}
      aria-hidden="true"
    />
  );
}

export function InlineLoader({ label = "Loading...", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-slate-600 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Spinner size="sm" />
      <span>{label}</span>
    </span>
  );
}

export function CardLoader({ label = "Loading...", className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Spinner />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="container-page py-12" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-card">
        <Spinner size="lg" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}
