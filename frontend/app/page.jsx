"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/layouts/SiteFooter";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicHomeQuery } from "@/lib/features/home/homeApi";

/* ───────── constants ───────── */

const statusBadge = {
  active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  upcoming: "border border-amber-200 bg-amber-50 text-amber-700",
  archived: "border border-slate-200 bg-slate-100 text-slate-700",
};

function formatCurrency(value, currency = "BDT") {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${currency}`;
}

/* ───────── useScrollReveal hook ───────── */

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════
   HERO (AUTO SLIDER)
   ═══════════════════════════════════════════════════════════ */

const HOME_HERO_CONTENT = {
  accent: "Learn Smarter,",
  title: "prepare with confidence for every academic goal.",
  description:
    "One focused learning ecosystem for SSC, HSC, and admission preparation with guided classes, structured practice, and dependable support.",
  highlights: [
    "Live classes with experienced faculty",
    "Online and offline enrollment support",
    "Practice-first routine with progress tracking",
  ],
};

const ABOUT_FALLBACK = {
  heading: "A Complete Learning Ecosystem",
  description:
    "We deliver structured academic preparation for SSC, HSC, and admission with strong faculty guidance and operational clarity.",
  mission:
    "Build a consistent, accountable, and result-oriented learning system for every committed student.",
  highlights: [
    "Structured curriculum flow from course to chapter",
    "Faculty-led delivery and academic review",
    "Transparent enrollment and monthly payment process",
    "Continuous student support with measurable progress",
  ],
};

function HomeHeroSlider({ slides }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const total = slides?.length || 0;
  const slideDuration = 6500;

  useEffect(() => {
    if (total < 2) return;

    const tickInterval = 100;
    const step = (tickInterval / slideDuration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          setCurrent((prevIndex) => (prevIndex + 1) % total);
          return 0;
        }
        return next;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [total]);

  useEffect(() => {
    setProgress(0);
  }, [current]);

  if (!total) return null;

  const goTo = (target) => {
    setCurrent((target + total) % total);
    setProgress(0);
  };

  return (
    <section className="container-page py-8 md:py-12">
      <div className="relative overflow-hidden rounded-[16px] border border-slate-300 bg-[#eceeee] px-5 py-8 shadow-[0_8px_20px_rgba(15,23,42,0.12)] md:px-10 md:py-10">
        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Academic Care
            </p>
            <h1 className="text-3xl font-black leading-[1.12] tracking-tight text-slate-800 sm:text-4xl lg:text-[52px]">
              <span className="text-emerald-600">{HOME_HERO_CONTENT.accent}</span>{" "}
              {HOME_HERO_CONTENT.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700">
              {HOME_HERO_CONTENT.description}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {HOME_HERO_CONTENT.highlights.map((item, idx) => (
                <article
                  key={idx}
                  className="rounded-[14px] border border-slate-300 bg-white p-4 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-slate-700">{item}</p>
                </article>
              ))}
            </div>

            {total > 1 && (
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  aria-label="Previous slide"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="h-2 w-36 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-100 ease-linear"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  aria-label="Next slide"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="relative overflow-hidden rounded-[14px] border border-slate-300 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
              {slides.map((slide, idx) => (
                slide.imageUrl ? (
                  <img
                    key={idx}
                    src={slide.imageUrl}
                    alt={`Hero slide ${idx + 1}`}
                    className={`absolute inset-0 h-[300px] w-full object-cover transition-opacity duration-700 sm:h-[360px] lg:h-[500px] ${
                      idx === current ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ) : null
              ))}
              <div
                className={`h-[300px] sm:h-[360px] lg:h-[500px] ${
                  slides[current]?.imageUrl
                    ? ""
                    : "bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100"
                }`}
              />
              {total > 1 && (
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-emerald-700">{String(current + 1).padStart(2, "0")}</span>
                  <span className="text-slate-400">/</span>
                  <span>{String(total).padStart(2, "0")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutHomeSection({ about, isLoading, isError, metrics }) {
  const heading = about?.heading || ABOUT_FALLBACK.heading;
  const description = about?.description || ABOUT_FALLBACK.description;
  const mission = about?.mission || ABOUT_FALLBACK.mission;
  const highlights = (about?.highlights || []).length
    ? about.highlights
    : ABOUT_FALLBACK.highlights;
  const aboutMetrics = [
    {
      label: "Active Courses",
      value: String(metrics?.courseCount || 0).padStart(2, "0"),
      note: "Live programs",
    },
    {
      label: "Faculty & Support",
      value: String(metrics?.facultyCount || 0).padStart(2, "0"),
      note: "Academic team",
    },
    {
      label: "Delivery Modes",
      value: "02",
      note: "Online and offline",
    },
  ];

  return (
    <section id="about" className="container-page scroll-mt-24 py-14 md:py-18">
      <RevealSection>
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            About Us
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            {description}
          </p>
        </div>
      </RevealSection>

      <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <RevealSection>
          <article className="rounded-[16px] border border-slate-300 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.12)] md:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Our Mission
            </p>
            <p className="mt-3 text-sm leading-8 text-slate-700 md:text-[15px]">{mission}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {aboutMetrics.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                </article>
              ))}
            </div>
          </article>
        </RevealSection>

        <RevealSection delay={100}>
          <article className="rounded-[16px] border border-slate-300 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.12)] md:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Core Highlights
            </p>
            {isError ? (
              <div className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                Live data is unavailable right now. Showing default overview.
              </div>
            ) : null}
            {isLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-14 animate-pulse rounded-[12px] bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 rounded-[12px] border border-slate-200 bg-white">
                {highlights.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="flex items-start gap-3 px-4 py-4">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </RevealSection>
      </div>
    </section>
  );
}

function memberInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function FacultyHomeSection({ faculty, isLoading, isError }) {
  const totalAssignments = faculty.reduce(
    (count, member) => count + (member.assignedBatches?.length || 0),
    0
  );

  return (
    <section id="faculty" className="container-page scroll-mt-24 pb-14 md:pb-20">
      <RevealSection>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Faculty
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Faculty and Support Team
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              A coordinated team of teachers, mentors, and support staff ensuring quality
              delivery and consistent learner support.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-right shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Team Members
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{faculty.length}</p>
            </div>
            <div className="rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-right shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Course Assignments
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalAssignments}</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[250px] animate-pulse rounded-[14px] border border-slate-300 bg-white/80 shadow-[0_4px_10px_rgba(15,23,42,0.1)]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Failed to load faculty data from backend.
        </div>
      ) : faculty.length === 0 ? (
        <div className="rounded-[14px] border border-slate-300 bg-white px-6 py-10 text-center shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
          <p className="font-display text-2xl font-black text-slate-950">
            No faculty members available.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member, index) => (
            <RevealSection key={member.id} delay={index * 80}>
              <article className="group relative overflow-hidden rounded-[14px] border border-slate-300 bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.11)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.14)]">
                <div className="relative flex items-start gap-4">
                  {member.profilePhotoUrl ? (
                    <img
                      src={member.profilePhotoUrl}
                      alt={member.fullName}
                      className="h-16 w-16 rounded-[12px] object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-gradient-to-br from-slate-900 via-emerald-800 to-teal-600 text-sm font-black text-white">
                      {memberInitials(member.fullName) || "NA"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black text-slate-900">{member.fullName}</h3>
                    <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {member.email ? (
                    <p className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="truncate">{member.email}</span>
                    </p>
                  ) : null}
                  {member.phone ? (
                    <p className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 4.5l5.159 1.29a2.25 2.25 0 011.591 1.591l.868 3.47a2.25 2.25 0 01-.641 2.121l-1.455 1.455a16.5 16.5 0 007.348 7.348l1.455-1.455a2.25 2.25 0 012.121-.641l3.47.868a2.25 2.25 0 011.591 1.591l1.29 5.159A2.25 2.25 0 0122.5 22.5h-1.5C10.73 22.5 1.5 13.27 1.5 2.999v-1.5A2.25 2.25 0 013.749 0z" />
                      </svg>
                      <span>{member.phone}</span>
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Assigned Courses
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(member.assignedBatches || []).length ? (
                      member.assignedBatches.map((batch) => (
                        <span
                          key={batch.id}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {batch.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No course assignment</span>
                    )}
                  </div>
                </div>
              </article>
            </RevealSection>
          ))}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   COURSE CARD
   ═══════════════════════════════════════════════════════════ */

function CourseCard({ course }) {
  const courseImage = course?.banner?.url || course?.thumbnail?.url || "";

  return (
    <article className="group relative overflow-hidden rounded-[14px] border border-slate-300 bg-[#eceeee] shadow-[0_6px_14px_rgba(15,23,42,0.11)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.15)]">
      {/* Image */}
      <div className="relative h-44 overflow-hidden rounded-[10px] bg-slate-200">
        {courseImage ? (
          <>
            <img
              src={courseImage}
              alt={course.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <div className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600">
              No course image
            </div>
          </div>
        )}

        {/* Status badge */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] ${
            statusBadge[course.status] || statusBadge.archived
          }`}
        >
          {course.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2 transition-colors group-hover:text-emerald-700">
          {course.name}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
          {course.description || "Structured learning with chapter-based class progression."}
        </p>

        {/* Price section */}
        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-white px-3.5 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Fee</p>
            <p className="text-sm font-extrabold text-slate-900">
              {formatCurrency(course.monthlyFee, course.currency || "BDT")}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/courses/${course._id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-300 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95"
        >
          Open Course
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const { data, isLoading, isError } = useGetPublicHomeQuery();

  const heroSlides = data?.data?.heroSlides || [];
  const runningCourses = data?.data?.runningCourses || [];
  const about = data?.data?.about || {};
  const faculty = data?.data?.faculty || [];

  const primaryCourses = useMemo(() => runningCourses.slice(0, 8), [runningCourses]);
  const homeHeroSlides = useMemo(() => {
    const prepared = (heroSlides || [])
      .filter((slide) => slide?.imageUrl)
      .sort((a, b) => Number(a?.priority || 0) - Number(b?.priority || 0));

    if (!prepared.length) {
      return [{ imageUrl: "" }];
    }

    return prepared.map((slide, index) => ({
      id: slide.id,
      priority: Number(slide.priority || index),
      imageUrl: slide.imageUrl,
    }));
  }, [heroSlides]);

  const courseCards = useMemo(
    () =>
      primaryCourses.map((course, index) => (
        <RevealSection key={course._id} delay={index * 80}>
          <CourseCard course={course} />
        </RevealSection>
      )),
    [primaryCourses]
  );

  return (
    <main className="site-shell site-nav-offset min-h-screen text-slate-800">
      <Navbar />

      {/* Hero */}
      <HomeHeroSlider slides={homeHeroSlides} />

      {/* Courses Section */}
      <section className="container-page pt-12 pb-12 md:pt-16 md:pb-16">
        <RevealSection>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                Popular Courses
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                Popular Courses
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                Explore active programs designed for strong academic outcomes and focused preparation.
              </p>
            </div>
            <Link
              href="/courses"
              className="group hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md sm:inline-flex"
            >
              View All
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </RevealSection>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <svg className="mx-auto h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="mt-3 text-sm font-semibold text-rose-700">Failed to load homepage data from backend.</p>
            <p className="mt-1 text-xs text-rose-500">Please check your connection or try again.</p>
          </div>
        ) : primaryCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="mt-3 text-lg font-bold text-slate-900">No courses available right now.</p>
            <p className="mt-1 text-sm text-slate-500">Check back soon for upcoming courses.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{courseCards}</div>
            {/* Mobile view all */}
            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                View All Courses
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* About Section */}
      <AboutHomeSection
        about={about}
        isLoading={isLoading}
        isError={isError}
        metrics={{ courseCount: runningCourses.length, facultyCount: faculty.length }}
      />

      {/* Faculty Section */}
      <FacultyHomeSection faculty={faculty} isLoading={isLoading} isError={isError} />

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
