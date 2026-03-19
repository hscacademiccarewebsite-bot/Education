"use client";

import Link from "next/link";
import { useGetPublicAboutQuery } from "@/lib/features/home/homeApi";
import { RevealItem, RevealSection } from "@/components/motion/MotionReveal";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function HighlightCard({ title, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export default function AboutUsPage() {
  const { t } = useSiteLanguage();
  const { data, isLoading, isError } = useGetPublicAboutQuery();
  const about = data?.data || {};
  const operatingItems = t("aboutPage.operatingItems", []);
  const highlights =
    Array.isArray(about?.highlights) && about.highlights.length
      ? about.highlights
      : null;

  return (
    <section className="container-page py-8 md:py-12">
      <RevealSection noStagger className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_55%,_#eff6ff_100%)] px-5 py-7 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:px-8 md:py-10">
        <RevealItem>
          <span className="inline-flex rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            {t("aboutPage.eyebrow")}
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-[44px]">
            <span className="text-emerald-600">{t("aboutPage.accent")}</span>{" "}
            {t("aboutPage.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            {t("aboutPage.description")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses" className="site-button-primary px-5 py-2.5 text-[11px]">
              {t("aboutPage.exploreCourses")}
            </Link>
            <Link href="/faculty" className="site-button-secondary px-5 py-2.5 text-[11px]">
              {t("aboutPage.meetFaculty")}
            </Link>
          </div>
        </RevealItem>
      </RevealSection>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <RevealSection className="space-y-6">
          <RevealItem>
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t("aboutPage.overview")}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-[15px]">
                {isLoading
                  ? "Loading..."
                  : about?.description || t("aboutPage.defaultDescription")}
              </p>
            </div>
          </RevealItem>

          <RevealItem>
            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                {t("aboutPage.mission")}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-200 md:text-[15px]">
                {isLoading
                  ? "Loading..."
                  : about?.mission || t("aboutPage.defaultDescription")}
              </p>
            </div>
          </RevealItem>

          {isError ? (
            <RevealItem>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {t("aboutPage.loadError")}
              </div>
            </RevealItem>
          ) : null}
        </RevealSection>

        <RevealSection className="space-y-4">
          <RevealItem>
            <HighlightCard
              title={t("aboutPage.operatingModel")}
              description={t("aboutPage.defaultDescription")}
            />
          </RevealItem>

          {operatingItems.map((item, index) => (
            <RevealItem key={item}>
              <article className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
              </article>
            </RevealItem>
          ))}
        </RevealSection>
      </div>

      <RevealSection className="mt-8">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t("aboutPage.coreStrengths")}
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                {t("aboutPage.strengthsTitle", "Operational strengths behind the platform")}
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(highlights || [t("aboutPage.highlightsEmpty")]).map((item, index) => (
              <RevealItem key={`${item}-${index}`}>
                <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </article>
              </RevealItem>
            ))}
          </div>
        </div>
      </RevealSection>
    </section>
  );
}
