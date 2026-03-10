"use client";

import Link from "next/link";
import PageHero from "@/components/layouts/PageHero";
import { CardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicAboutQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function AboutUsPage() {
  const { data, isLoading, isError } = useGetPublicAboutQuery();
  const about = data?.data;
  const { t } = useSiteLanguage();
  const operatingItemsRaw = t("aboutPage.operatingItems", []);
  const operatingItems = Array.isArray(operatingItemsRaw) ? operatingItemsRaw : [];

  return (
    <section className="container-page py-8 md:py-10">
      <PageHero
        eyebrow={t("aboutPage.eyebrow")}
        title={about?.heading || t("aboutPage.titleFallback")}
        description={t("aboutPage.description")}
        actions={
          <>
            <Link href="/courses" className="site-button-primary">
              {t("aboutPage.exploreCourses")}
            </Link>
            <Link href="/faculty" className="site-button-secondary">
              {t("aboutPage.meetFaculty")}
            </Link>
          </>
        }
        aside={
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
              {t("aboutPage.operatingModel")}
            </p>
            <div className="mt-4 space-y-3">
              {operatingItems.map((item) => (
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
        <article className="site-panel rounded-[clamp(8px,5%,12px)] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {t("aboutPage.overview")}
          </p>

          {isLoading ? (
            <div className="mt-5">
              <CardSkeleton />
            </div>
          ) : isError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {t("aboutPage.loadError")}
            </div>
          ) : (
            <>
              <p className="mt-5 text-base leading-8 text-slate-700">
                {about?.description ||
                  t("aboutPage.defaultDescription")}
              </p>

              {about?.mission ? (
                <div className="site-panel-muted mt-6 rounded-[clamp(8px,5%,12px)] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    {t("aboutPage.mission")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{about.mission}</p>
                </div>
              ) : null}
            </>
          )}
        </article>

        <article className="site-panel rounded-[clamp(8px,5%,12px)] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {t("aboutPage.coreStrengths")}
          </p>
          <div className="mt-5 space-y-3">
            {(about?.highlights || []).length ? (
              (about?.highlights || []).map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white px-4 py-4 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[clamp(8px,5%,12px)] bg-emerald-50 text-[11px] font-black text-emerald-700">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-1 text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white px-4 py-4 text-sm text-slate-600">
                {t("aboutPage.highlightsEmpty")}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
