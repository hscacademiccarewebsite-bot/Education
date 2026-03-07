"use client";

import Link from "next/link";
import PageHero from "@/components/layouts/PageHero";
import { CardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicAboutQuery } from "@/lib/features/home/homeApi";

export default function AboutUsPage() {
  const { data, isLoading, isError } = useGetPublicAboutQuery();
  const about = data?.data;

  return (
    <section className="container-page py-8 md:py-10">
      <PageHero
        eyebrow="Institution Story"
        title={about?.heading || "About HSC Academic & Admission Care"}
        description="A disciplined learning system designed for academic consistency, strong faculty oversight, and a clear path from enrollment to chapter-wise study."
        actions={
          <>
            <Link href="/courses" className="site-button-primary">
              Explore Courses
            </Link>
            <Link href="/faculty" className="site-button-secondary">
              Meet Faculty
            </Link>
          </>
        }
        aside={
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
              Operating Model
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Course-driven academic structure",
                "Staff-reviewed enrollment governance",
                "Monthly payment visibility",
                "Chapter-wise content progression",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
      />

      <div className="site-grid mt-6 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
        <article className="site-panel rounded-[14px] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Overview
          </p>

          {isLoading ? (
            <div className="mt-5">
              <CardSkeleton />
            </div>
          ) : isError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              Failed to load about us content from backend.
            </div>
          ) : (
            <>
              <p className="mt-5 text-base leading-8 text-slate-700">
                {about?.description ||
                  "We organize learning with clear operational discipline so students, teachers, and administrators can move through the platform without ambiguity."}
              </p>

              {about?.mission ? (
                <div className="site-panel-muted mt-6 rounded-[12px] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Mission
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{about.mission}</p>
                </div>
              ) : null}
            </>
          )}
        </article>

        <article className="site-panel rounded-[14px] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Core Strengths
          </p>
          <div className="mt-5 space-y-3">
            {(about?.highlights || []).length ? (
              (about?.highlights || []).map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-[12px] border border-slate-300 bg-white px-4 py-4 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-[11px] font-black text-emerald-700">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-1 text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[12px] border border-slate-300 bg-white px-4 py-4 text-sm text-slate-600">
                Highlights are not configured yet.
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
