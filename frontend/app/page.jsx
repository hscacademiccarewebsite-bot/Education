"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
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

/* ───────── animations ───────── */

const fadeInUp = {
  initial: { opacity: 0, y: 30, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function RevealSection({ children, className = "", delay = 0, noStagger = false }) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-10%" }}
      variants={noStagger ? fadeInUp : staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function RevealItem({ children, className = "", delay = 0 }) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}
/* ═══════════════════════════════════════════════════════════
   HERO (AUTO SLIDER)
   ═══════════════════════════════════════════════════════════ */
function HomeHeroSlider({ slides, stats = [], t }) {
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
        if (prev >= 100) return 100; // Cap at 100 until effect catches it
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [total, current]);

  // When progress hits 100, move slide
  useEffect(() => {
    if (progress >= 100) {
      setCurrent((prev) => (prev + 1) % total);
      setProgress(0);
    }
  }, [progress, total]);

  if (!total) return null;

  const goTo = (target) => {
    setCurrent((target + total) % total);
    setProgress(0);
  };

  return (
    <section className="container-page py-3 md:py-7">
      <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-[#eceeee] px-1 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4 md:px-8 md:py-6">
        <div className="relative flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-6 xl:grid-cols-[0.98fr_1.02fr] xl:gap-8">

          {/* ── IMAGE (mobile: first/top) ─────────────────────────── */}
          <motion.div
            className="order-first -mx-3.5 sm:-mx-1 lg:mx-0 lg:order-last"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative overflow-hidden rounded-[clamp(8px,5%,12px)]">
              <AnimatePresence mode="wait">
                {slides.map((slide, idx) => (
                  idx === current && slide.imageUrl ? (
                    <motion.div
                      key={slide.id || idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={slide.imageUrl}
                        alt={`${t("home.hero.slideAltPrefix")} ${idx + 1}`}
                        className="absolute inset-0 h-full w-full object-contain"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </motion.div>
                  ) : null
                ))}
              </AnimatePresence>
              <div
                className={`h-[240px] sm:h-[245px] lg:h-[410px] xl:h-[440px] ${
                  slides[current]?.imageUrl
                    ? ""
                    : "bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100"
                }`}
              />
              {total > 1 && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <span className="text-emerald-700">{String(current + 1).padStart(2, "0")}</span>
                  <span className="text-slate-400">/</span>
                  <span>{String(total).padStart(2, "0")}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── TEXT (mobile: second/below image) ────────────────── */}
          <div className="order-last lg:order-first">
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.p variants={fadeInUp} className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700 sm:px-3">
              {t("home.hero.kicker")}
            </motion.p>
            <motion.h1 variants={fadeInUp} className="mt-2.5 max-w-[16ch] text-[21px] font-black leading-[1.08] tracking-tight text-slate-800 sm:max-w-[18ch] sm:text-[27px] lg:max-w-[17ch] lg:text-[31px] xl:text-[35px]">
              <span className="block text-emerald-600">{t("home.hero.accent")}</span>
              <span className="mt-1 block sm:mt-1.5">{t("home.hero.title")}</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-2.5 max-w-2xl text-[12px] leading-[1.5] text-slate-600 sm:mt-3 sm:text-[13px] sm:leading-[1.6] lg:text-[14px] lg:leading-6">
              {t("home.hero.description")}
            </motion.p>

            <motion.div variants={staggerContainer} className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-3">
              {stats.map((stat, idx) => {
                const configs = [
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    ),
                    iconBg: "bg-emerald-100 text-emerald-600",
                    border: "border-l-emerald-400",
                    valueCls: "text-emerald-600",
                    bg: "bg-gradient-to-br from-white to-emerald-50/60",
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    ),
                    iconBg: "bg-indigo-100 text-indigo-600",
                    border: "border-l-indigo-400",
                    valueCls: "text-indigo-600",
                    bg: "bg-gradient-to-br from-white to-indigo-50/60",
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    iconBg: "bg-sky-100 text-sky-600",
                    border: "border-l-sky-400",
                    valueCls: "text-sky-600",
                    bg: "bg-gradient-to-br from-white to-sky-50/60",
                  },
                ];
                const cfg = configs[idx] || configs[0];
                return (
                  <RevealItem
                    key={idx}
                    className={`group/card flex items-center gap-2 rounded-xl border border-slate-200 border-l-4 ${cfg.border} ${cfg.bg} px-2.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.1)]`}
                  >
                    <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[17px] font-black leading-none tracking-tight sm:text-[18px] ${cfg.valueCls}`}>
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-500 sm:text-[10px]">
                        {stat.label}
                      </p>
                    </div>
                  </RevealItem>
                );
              })}
            </motion.div>

            {total > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  aria-label={t("home.hero.previousSlide")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md hover:text-emerald-600 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200/50 sm:w-28">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  aria-label={t("home.hero.nextSlide")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md hover:text-emerald-600 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

function AboutHomeSection({ metrics, t }) {
  const heading = t("home.about.heading");
  const headingAccent = t("home.about.accent");
  const description = t("home.about.description");
  const mission = t("home.about.mission");
  const detail = t("home.about.detail");

  const statCards = [
    {
      id: "courses",
      icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
      value: metrics?.courseCount || 0,
      label: t("home.about.metrics.activeCourses"),
      sublabel: t("home.about.metrics.livePrograms"),
    },
    {
      id: "faculty",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      value: metrics?.facultyCount || 0,
      label: t("home.about.metrics.facultySupport"),
      sublabel: t("home.about.metrics.academicTeam"),
    },
    {
      id: "modes",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      value: 2,
      label: t("home.about.metrics.deliveryModes"),
      sublabel: t("home.about.metrics.onlineOffline"),
    },
  ];

  return (
    <section id="about" className="container-page scroll-mt-24 py-9 md:py-16 lg:py-20">
      <RevealSection noStagger>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start xl:gap-12">

          {/* ── LEFT: Text content ─────────────────────────────── */}
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Kicker + heading */}
            <RevealItem>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 backdrop-blur-sm">
                <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                {t("home.about.kicker")}
              </span>
            </RevealItem>

            <RevealItem>
              <h2 className="text-[22px] font-black leading-[1.14] tracking-tight text-slate-900 sm:text-[25px] md:text-[30px] lg:text-[34px]">
                <span className="text-emerald-600">{headingAccent}</span>{" "}
                {heading}
              </h2>
            </RevealItem>

            {/* Paragraphs */}
            <RevealItem>
              <p className="text-[13px] leading-[1.65] text-slate-600 md:text-[14px] md:leading-7">{description}</p>
            </RevealItem>

            <RevealItem>
              <div className="h-1 w-12 rounded-full bg-emerald-400" />
            </RevealItem>

            <RevealItem>
              <p className="text-[13px] leading-[1.65] text-slate-600 md:text-[14px] md:leading-7">{mission}</p>
            </RevealItem>

            <RevealItem>
              <p className="text-[12px] sm:text-[13px] leading-[1.6] text-slate-500 md:text-[14px] md:leading-6">{detail}</p>
            </RevealItem>

            {/* Trust strip */}
            <RevealItem>
              <div className="mt-1 flex flex-wrap gap-2 md:mt-2 md:gap-3">
                {[
                  "Structured Academic Flow",
                  "Faculty-Led Mentoring",
                  "Transparent Enrollment",
                  "HSC & Admission Ready",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50/50 px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm backdrop-blur-sm md:px-3 md:py-1.5 md:text-[11px]"
                  >
                    <svg className="h-3 w-3 text-emerald-500 md:h-3 md:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>
            </RevealItem>
          </div>

          {/* ── RIGHT: Stat cards ─────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:pt-8">
            {statCards.map((card, idx) => (
              <RevealItem key={card.id}>
                <div className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:gap-5 sm:p-5">
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 h-full w-1 rounded-r bg-emerald-400 opacity-60 transition-opacity group-hover:opacity-100" />

                  {/* Icon */}
                  <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 sm:h-12 sm:w-12">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-black tabular-nums leading-none text-slate-900 sm:text-3xl">
                      {String(card.value).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 sm:text-[11px]">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1 sm:text-xs">{card.sublabel}</p>
                  </div>
                </div>
              </RevealItem>
            ))}

            {/* Bottom decorative note */}
            <RevealItem className="mt-2 sm:col-span-2 lg:col-span-1">
              <div className="rounded-2xl border border-emerald-100/60 bg-emerald-50/50 p-4 sm:px-5 sm:py-4">
                <p className="text-[11px] leading-[1.6] text-emerald-700/90 sm:text-xs sm:leading-6">
                  <span className="font-black">100% structured delivery</span> — every batch follows a defined schedule with faculty oversight from day one.
                </p>
              </div>
            </RevealItem>
          </div>

        </div>
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
    <section id="faculty" className="container-page scroll-mt-24 pb-16 md:pb-24">
      {/* ── Section Header ── */}
      <RevealSection>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
              {t("home.faculty.kicker")}
            </span>
            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900 md:text-[30px]">
              <span className="text-emerald-600">{t("home.faculty.accent")}</span>{" "}
              {t("home.faculty.title")}
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500 sm:text-base sm:leading-7">
              {t("home.faculty.description")}
            </p>
          </div>


        </div>
      </RevealSection>

      {/* ── Cards ── */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[180px] animate-pulse rounded-3xl border border-slate-200 bg-white/80"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
          {t("home.faculty.loadError")}
        </div>
      ) : faculty.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-4 text-lg font-black text-slate-400">{t("home.faculty.empty")}</p>
        </div>
      ) : (
        <RevealSection className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {faculty.map((member, index) => {
            const initials = member.fullName
              ? member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            const bgSeeds = ["#0f766e","#0369a1","#7c3aed","#b45309","#be185d","#047857"];
            const avatarBg = bgSeeds[index % bgSeeds.length];

            return (
              <RevealItem key={member.id || index}>
                <article className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.13)]">

                  {/* Top decorative strip */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div className="flex flex-1 flex-col items-center p-5 text-center w-full">
                    {/* Avatar */}
                    <div className="relative mb-4 shrink-0">
                      <Avatar
                        src={member.profilePhotoUrl}
                        name={member.fullName}
                        className="h-14 w-14 rounded-full ring-4 ring-white shadow-md"
                        fallbackClassName="text-white text-lg font-black"
                        style={{ backgroundColor: avatarBg }}
                      />
                      {/* Online dot */}
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                    </div>

                    {/* Name */}
                    <h3 className="line-clamp-2 text-sm font-black leading-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {member.fullName}
                    </h3>

                    {/* Institution */}
                    {member.varsity && (
                      <p className="mt-2 text-[11px] font-bold text-emerald-600 leading-tight">
                        {member.varsity}
                      </p>
                    )}

                    {/* Experience */}
                    {member.experience && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {member.experience}
                      </span>
                    )}

                    {/* Role badge */}
                    <div className="mt-auto pt-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 transition group-hover:bg-emerald-100">
                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                        {member.role || "Teacher"}
                      </span>
                    </div>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealSection>
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
  const apiStats = data?.data?.stats;

  const heroStats = [
    {
      value: apiStats?.gpa5Count ? `${apiStats.gpa5Count}+` : "—",
      label: t("home.hero.stats.gpa5", "GPA 5 Achieved"),
    },
    {
      value: apiStats?.publicAdmissionCount ? `${apiStats.publicAdmissionCount}+` : "—",
      label: t("home.hero.stats.publicAdmission", "Public University Admissions"),
    },
    {
      value: apiStats?.studentCount ? `${apiStats.studentCount}+` : "—",
      label: t("home.hero.stats.students", "Active Students"),
    },
  ];

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
          <RevealItem key={course._id}>
            <CourseCatalogCard
              course={course}
              index={index}
              showApplyAction={showApplyAction}
              enrollmentStatus={enrollmentStatus}
              showEnrollmentStatus={studentRole}
            />
          </RevealItem>
        );
      }),
    [primaryCourses, studentRole, enrollmentMap]
  );

  return (
    <main className="site-shell site-nav-offset min-h-screen text-slate-800">
      {/* Hero */}
      <HomeHeroSlider slides={homeHeroSlides} stats={heroStats} t={t} />

      {/* Courses Section */}
      <section className="container-page pt-12 pb-12 md:pt-16 md:pb-16">
        <RevealSection>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                {t("home.courses.kicker")}
              </span>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900 md:text-[30px]">
                <span className="text-emerald-600">{t("home.courses.accent")}</span>{" "}
                {t("home.courses.title")}
              </h2>
              <p className="mt-2 max-w-lg text-[11px] leading-5 text-slate-500 sm:text-sm">
                {t("home.courses.description")}
              </p>
            </div>
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
        <RevealSection className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {courseCards}
        </RevealSection>
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
