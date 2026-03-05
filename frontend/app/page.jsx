"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CardLoader, CourseCardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicHomeQuery } from "@/lib/features/home/homeApi";

const coverFallbacks = [
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=70",
];

const statusStyles = {
  active: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-orange-100 text-orange-700",
  archived: "bg-slate-200 text-slate-700",
};

function formatCurrency(value, currency = "BDT") {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${currency}`;
}

function HeroSlider({ slides }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = slides?.length || 0;

  const goTo = (idx) => setCurrent((idx + total) % total);
  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);

  useEffect(() => {
    if (total < 2 || isPaused) return undefined;
    const timer = setInterval(() => goTo(current + 1), 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isPaused, total]);

  if (!total) return null;

  const slide = slides[current];
  const caption = slide.caption || slide.description || "";
  const buttonEnabled = slide.buttonEnabled !== false;
  const buttonText = slide.buttonText || slide.ctaLabel || "Explore Courses";
  const buttonHref = slide.buttonHref || slide.ctaHref || "/courses";

  return (
    <section
      className="relative pt-[64px] md:pt-[72px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[480px] overflow-hidden bg-slate-950 md:h-[600px] xl:h-[680px]">

        {/* Images — crossfade + Ken Burns */}
        {slides.map((s, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={s.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={s.imageUrl}
                alt={s.title}
                className={`h-full w-full object-cover transition-transform duration-[10000ms] ease-out ${
                  isActive ? "scale-110" : "scale-100"
                }`}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Sophisticated Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/80 to-transparent" />

        {/* Text content — centered but slightly weighted */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
              {slide.eyebrow || "Excellence in Education"}
            </p>
          </div>
          
          <h1
            key={`ttl-${current}`}
            className="mx-auto max-w-4xl text-4xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]"
            style={{ animation: "hsFadeUpPremium 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {slide.title}
          </h1>
          
          <p
            key={`cap-${current}`}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-200/90 md:text-lg"
            style={{ animation: "hsFadeUpPremium 0.8s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {caption}
          </p>
          
          {buttonEnabled && (
            <div
              key={`btn-${current}`}
              className="mt-10"
              style={{ animation: "hsFadeUpPremium 0.8s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
            >
              <Link
                href={buttonHref}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-wider text-emerald-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95"
              >
                <span className="relative z-10">{buttonText}</span>
                <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
            </div>
          )}
        </div>

        {/* Modern Nav Dots */}
        {total > 1 && (
          <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 transition-all duration-500 ${
                  idx === current
                    ? "w-10 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]"
                    : "w-3 bg-white/30 hover:bg-white/60"
                } rounded-full`}
              />
            ))}
          </div>
        )}

        {/* Prev / Next arrows — sleek style */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-6 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 active:scale-90"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-6 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 active:scale-90"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes hsFadeUpPremium {
          from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </section>
  );
}

export default function HomePage() {
  const { data, isLoading, isError } = useGetPublicHomeQuery();

  const heroSlides = data?.data?.heroSlides || [];
  const runningCourses = data?.data?.runningCourses || [];
  const general = data?.data?.general || {};
  const contact = data?.data?.contact || {};

  const primaryCourses = useMemo(() => runningCourses.slice(0, 8), [runningCourses]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#f2f9f6_55%,#f9fbfd_100%)] text-slate-800">
      <Navbar />

      <HeroSlider slides={heroSlides} />

      <section className="container-page pb-10 pt-4 md:pb-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Featured Courses</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-3xl">
              Running Courses
            </h2>
          </div>
          <Link
            href="/courses"
            className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            Failed to load homepage data from backend.
          </div>
        ) : primaryCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-lg font-bold text-slate-900">No courses available right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primaryCourses.map((course, index) => (
              <article
                key={course._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]"
              >
                <img
                  src={course?.banner?.url || course?.thumbnail?.url || coverFallbacks[index % coverFallbacks.length]}
                  alt={course.name}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                      {course.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        statusStyles[course.status] || statusStyles.archived
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {course.description || "Structured learning with chapter-based class progression."}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Monthly Fee</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatCurrency(course.monthlyFee, course.currency || "BDT")}
                    </p>
                  </div>

                  <Link
                    href={`/courses/${course._id}`}
                    className="mt-3 inline-flex rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:brightness-105"
                  >
                    Open Course
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="container-page pb-12 md:pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/about-us"
            className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">About Us</p>
            <h3 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">Who We Are</h3>
            <p className="mt-2 text-sm text-slate-600">Learn about our mission, structure, and academic approach.</p>
          </Link>

          <Link
            href="/faculty"
            className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Faculty</p>
            <h3 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">Meet the Team</h3>
            <p className="mt-2 text-sm text-slate-600">View teachers and moderators guiding the platform.</p>
          </Link>

          <Link
            href="/contact-us"
            className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Contact Us</p>
            <h3 className="mt-2 text-xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">Get Support</h3>
            <p className="mt-2 text-sm text-slate-600">Reach out for enrollment, payment, or academic support.</p>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="container-page grid gap-5 py-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-black text-slate-900">
              {general.siteName || "HSC Academic & Admission Care"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {general.footerText ||
                general.siteTagline ||
                "A focused learning ecosystem for HSC and admission preparation."}
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Support</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              {contact.email ? <p>{contact.email}</p> : null}
              {contact.phone ? <p>{contact.phone}</p> : null}
              {contact.address ? <p>{contact.address}</p> : null}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Connect</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {contact.facebookPage ? (
                <a
                  href={contact.facebookPage}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Facebook
                </a>
              ) : null}
              {contact.whatsapp ? (
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
            {contact.officeHours ? (
              <p className="mt-2 text-xs text-slate-600">Office: {contact.officeHours}</p>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
