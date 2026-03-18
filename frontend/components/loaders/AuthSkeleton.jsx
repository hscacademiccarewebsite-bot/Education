"use client";

import { useEffect, useState } from "react";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function AuthSkeleton() {
  const { t } = useSiteLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial SSR / Hydration render: simple shell to match what the server had
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5" role="status" aria-live="polite">
        <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
        <p className="text-sm font-bold text-slate-700">Verifying session...</p>
      </div>
    );
  }

  // Gorgeous client-side design
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center select-none" role="status" aria-live="polite">
      
      {/* ── Visual Loader ─────────────────────────────────────────────────── */}
      <div className="relative mb-10 flex h-32 w-32 items-center justify-center scale-90 md:scale-100">
        {/* Deep Glowing background */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-4 animate-[reverse-spin_3s_linear_infinite] rounded-full border-t-2 border-l-2 border-emerald-200/40 opacity-50" />
        
        {/* Main Spinning Orb */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl ring-1 ring-emerald-50">
          <svg className="h-12 w-12 animate-spin text-emerald-500" viewBox="0 0 100 100">
            <circle
              className="opacity-10"
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="125.6"
              strokeDashoffset="100"
              d="M50 10 a 40 40 0 0 1 0 80 a 40 40 0 0 1 0 -80"
            />
          </svg>
          
          {/* Center Checkmark (Subtle) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Text Labels ───────────────────────────────────────────────────── */}
      <div className="space-y-3 animate-fade-up">
        <h2 className="font-display text-2xl font-black tracking-tight text-slate-800 md:text-3xl">
          {t("auth.verifying", "Verifying session")}
        </h2>
        <p className="text-sm font-medium text-slate-400 tracking-wide max-w-[280px]">
          {t("auth.justMoment", "Just a moment while we set things up…")}
        </p>
      </div>

      {/* ── Smooth Dot Loader ─────────────────────────────────────────────── */}
      <div className="mt-10 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-sm"
            style={{ 
              animation: `loadingProgress 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes loadingProgress {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes reverse-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}
