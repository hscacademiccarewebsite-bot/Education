"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/layouts/SiteFooter";
import CourseCatalogCard from "@/components/course/CourseCatalogCard";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useGetPublicHomeQuery } from "@/lib/features/home/homeApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { isStudent } from "@/lib/utils/roleUtils";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

/* ───────── constants ───────── */

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
function HomeHeroSlider({ slides, t }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const total = slides?.length || 0;
  const slideDuration = 6500;
  const heroHighlightsRaw = t("home.hero.highlights", []);
  const heroHighlights = Array.isArray(heroHighlightsRaw) ? heroHighlightsRaw : [];

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
      <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-[#eceeee] px-5 py-8 shadow-[0_8px_20px_rgba(15,23,42,0.12)] md:px-10 md:py-10">
        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              {t("home.hero.kicker")}
            </p>
            <h1 className="text-3xl font-black leading-[1.12] tracking-tight text-slate-800 sm:text-4xl lg:text-[52px]">
              <span className="text-emerald-600">{t("home.hero.accent")}</span>{" "}
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700">
              {t("home.hero.description")}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {heroHighlights.map((item, idx) => (
                <article
                  key={idx}
                  className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white p-4 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
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
                  aria-label={t("home.hero.previousSlide")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--action-soft-border)] bg-white text-[var(--action-soft-text)] transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-start)]"
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
                  aria-label={t("home.hero.nextSlide")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--action-soft-border)] bg-white text-[var(--action-soft-text)] transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-start)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
              {slides.map((slide, idx) => (
                slide.imageUrl ? (
                  <img
                    key={idx}
                    src={slide.imageUrl}
                    alt={`${t("home.hero.slideAltPrefix")} ${idx + 1}`}
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

function AboutHomeSection({ metrics, t }) {
  const heading = t("home.about.heading");
  const description = t("home.about.description");
  const mission = t("home.about.mission");
  const detail = t("home.about.detail");
  const highlightsRaw = t("home.about.highlights", []);
  const highlights = Array.isArray(highlightsRaw) ? highlightsRaw : [];
  const aboutMetrics = [
    {
      label: t("home.about.metrics.activeCourses"),
      value: String(metrics?.courseCount || 0).padStart(2, "0"),
      note: t("home.about.metrics.livePrograms"),
    },
    {
      label: t("home.about.metrics.facultySupport"),
      value: String(metrics?.facultyCount || 0).padStart(2, "0"),
      note: t("home.about.metrics.academicTeam"),
    },
    {
      label: t("home.about.metrics.deliveryModes"),
      value: "02",
      note: t("home.about.metrics.onlineOffline"),
    },
  ];
  const featureCards = [
    {
      title: t("home.about.cards.structuredLearning"),
      body: highlights[0],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h13" />
        </svg>
      ),
      tone: "text-emerald-700 bg-emerald-100",
    },
    {
      title: t("home.about.cards.facultyGuidance"),
      body: highlights[1],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m0-7a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
        </svg>
      ),
      tone: "text-cyan-700 bg-cyan-100",
    },
    {
      title: t("home.about.cards.enrollmentClarity"),
      body: highlights[2],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" />
        </svg>
      ),
      tone: "text-teal-700 bg-teal-100",
    },
    {
      title: t("home.about.cards.progressFocus"),
      body: highlights[3],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v3h3l9-9-3-3-9 9ZM14 6l3 3" />
        </svg>
      ),
      tone: "text-sky-700 bg-sky-100",
    },
  ];

  return (
    <section id="about" className="container-page scroll-mt-24 py-12 md:py-16">
      <RevealSection>
        <article className="relative overflow-hidden rounded-[clamp(10px,5%,14px)] border border-slate-300 bg-gradient-to-br from-white via-[#f5fbfa] to-[#eef7f5] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.12)] md:p-7">
          <div className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full bg-emerald-400/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                {t("home.about.kicker")}
              </span>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {heading}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 md:text-[17px]">{description}</p>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-700 md:text-[17px]">{mission}</p>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600 md:text-[16px]">
                {detail}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {aboutMetrics.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-[0_6px_14px_rgba(15,23,42,0.06)]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{item.value}</p>
                    <p className="text-[11px] text-slate-600">{item.note}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {featureCards.map((card, idx) => (
                <article
                  key={card.title}
                  className={`rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_20px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 ${
                    idx % 2 ? "sm:translate-y-5" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}
                  >
                    {card.icon}
                  </span>
                  <h3 className="mt-3 text-lg font-black text-slate-900">{card.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </article>
      </RevealSection>
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

function FacultyHomeSection({ faculty, isLoading, isError, t }) {
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
              {t("home.faculty.kicker")}
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {t("home.faculty.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              {t("home.faculty.description")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white px-4 py-3 text-right shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t("home.faculty.teamMembers")}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{faculty.length}</p>
            </div>
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white px-4 py-3 text-right shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t("home.faculty.courseAssignments")}
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
              className="h-[250px] animate-pulse rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white/80 shadow-[0_4px_10px_rgba(15,23,42,0.1)]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[clamp(8px,5%,12px)] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {t("home.faculty.loadError")}
        </div>
      ) : faculty.length === 0 ? (
        <div className="rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white px-6 py-10 text-center shadow-[0_4px_10px_rgba(15,23,42,0.1)]">
          <p className="font-display text-2xl font-black text-slate-950">
            {t("home.faculty.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member, index) => (
            <RevealSection key={member.id} delay={index * 80}>
              <article className="group relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-300 bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.11)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.14)]">
                <div className="relative flex items-start gap-4">
                  {member.profilePhotoUrl ? (
                    <img
                      src={member.profilePhotoUrl}
                      alt={member.fullName}
                      className="h-16 w-16 rounded-[clamp(8px,5%,12px)] object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-[clamp(8px,5%,12px)] bg-gradient-to-br from-slate-900 via-emerald-800 to-teal-600 text-sm font-black text-white">
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

                <div className="mt-4 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {t("home.faculty.assignedCourses")}
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
                      <span className="text-xs text-slate-500">{t("home.faculty.noAssignment")}</span>
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
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const role = useSelector(selectCurrentUserRole);
  const studentRole = isStudent(role);
  const { t } = useSiteLanguage();

  const { data, isLoading, isError } = useGetPublicHomeQuery();
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, {
    skip: !studentRole,
  });

  const heroSlides = data?.data?.heroSlides || [];
  const runningCourses = data?.data?.runningCourses || [];
  const faculty = data?.data?.faculty || [];

  const primaryCourses = useMemo(() => runningCourses.slice(0, 8), [runningCourses]);
  const enrollmentMap = useMemo(() => {
    const map = new Map();
    (myEnrollmentsData?.data || []).forEach((item) => {
      map.set(item.batch?._id || item.batch, item);
    });
    return map;
  }, [myEnrollmentsData]);
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
      primaryCourses.map((course, index) => {
        const enrollmentStatus = String(enrollmentMap.get(course._id)?.status || "");
        const showApplyAction =
          studentRole && enrollmentStatus !== "approved" && enrollmentStatus !== "pending";

        return (
          <RevealSection key={course._id} delay={index * 80}>
            <CourseCatalogCard
              course={course}
              index={index}
              showApplyAction={showApplyAction}
              enrollmentStatus={enrollmentStatus}
              showEnrollmentStatus={studentRole}
            />
          </RevealSection>
        );
      }),
    [primaryCourses, studentRole, enrollmentMap]
  );

  return (
    <main className="site-shell site-nav-offset min-h-screen text-slate-800">
      <Navbar />

      {/* Hero */}
      <HomeHeroSlider slides={homeHeroSlides} t={t} />

      {/* Courses Section */}
      <section className="container-page pt-12 pb-12 md:pt-16 md:pb-16">
        <RevealSection>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                {t("home.courses.kicker")}
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                {t("home.courses.title")}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                {t("home.courses.description")}
              </p>
            </div>
            <Link
              href="/courses"
              className="site-button-secondary group hidden items-center gap-2 sm:inline-flex"
            >
              {t("home.courses.viewAll")}
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
            <p className="mt-3 text-sm font-semibold text-rose-700">{t("home.courses.loadErrorTitle")}</p>
            <p className="mt-1 text-xs text-rose-500">{t("home.courses.loadErrorDescription")}</p>
          </div>
        ) : primaryCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="mt-3 text-lg font-bold text-slate-900">{t("home.courses.emptyTitle")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("home.courses.emptyDescription")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{courseCards}</div>
            {/* Mobile view all */}
            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/courses"
                className="site-button-primary inline-flex items-center gap-2"
              >
                {t("home.courses.viewAllMobile")}
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
        metrics={{ courseCount: runningCourses.length, facultyCount: faculty.length }}
        t={t}
      />

      {/* Faculty Section */}
      <FacultyHomeSection faculty={faculty} isLoading={isLoading} isError={isError} t={t} />

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
