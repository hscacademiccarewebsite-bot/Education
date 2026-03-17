"use client";

import React from "react";

export function PostSkeleton() {
  return (
    <div className="mb-4 rounded-xl lg:rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-slate-100 rounded" />
          <div className="h-2 w-16 bg-slate-50 rounded" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-2.5 mb-4">
        <div className="h-3 w-full bg-slate-50 rounded" />
        <div className="h-3 w-[90%] bg-slate-50 rounded" />
        <div className="h-3 w-[70%] bg-slate-50 rounded" />
      </div>

      {/* Stats Skeleton */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-4">
        <div className="flex gap-4">
          <div className="h-8 w-16 bg-slate-50 rounded-lg" />
          <div className="h-8 w-16 bg-slate-50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function NoteSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 border border-slate-200/60 shadow-sm animate-pulse mb-3.5">
      <div className="flex items-start gap-3.5">
        <div className="h-10 w-10 bg-slate-100 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-slate-50 rounded" />
            <div className="h-2.5 w-[80%] bg-slate-50 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-slate-100 rounded-lg" />
            <div className="h-5 w-20 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
