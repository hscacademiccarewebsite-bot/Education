"use client";

function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      <Shimmer />
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <Skeleton className="h-36 w-full" />
      <div className="p-5">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
        <Skeleton className="mt-2.5 h-2.5 w-full rounded-full" />
        <Skeleton className="mt-1.5 h-2.5 w-2/3 rounded-full" />
        
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <Skeleton className="h-5 w-1/3 rounded-full" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function Spinner({ size = "md", className = "" }) {
  const sizeClass =
    size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-[3px]" : "h-6 w-6 border-[3px]";

  return (
    <span
      className={`${sizeClass} inline-block animate-spin rounded-full border-emerald-600 border-t-transparent ${className}`}
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
      <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-100 relative">
        <Shimmer />
      </div>
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
    </span>
  );
}

// Deprecated: Moving towards skeletons
export function CardLoader({ label = "Loading...", className = "" }) {
  return <CardSkeleton className={className} />;
}

// Deprecated: Moving towards skeletons
export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="container-page py-12">
      <CardSkeleton />
    </div>
  );
}
