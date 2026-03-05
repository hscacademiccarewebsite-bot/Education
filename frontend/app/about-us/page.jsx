"use client";

import { useGetPublicAboutQuery } from "@/lib/features/home/homeApi";
import { CardSkeleton } from "@/components/loaders/AppLoader";

export default function AboutUsPage() {
  const { data, isLoading, isError } = useGetPublicAboutQuery();
  const about = data?.data;

  return (
    <section className="container-page py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">About Us</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
          {about?.heading || "About HSC Academic & Admission Care"}
        </h1>

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
            <p className="mt-5 text-base leading-relaxed text-slate-700">{about?.description}</p>

            {about?.mission ? (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Our Mission</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{about.mission}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(about?.highlights || []).map((item, idx) => (
                <article key={`${item}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">{item}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
