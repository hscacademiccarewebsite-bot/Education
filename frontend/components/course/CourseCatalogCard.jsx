"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const statusMeta = {
  active: {
    labelKey: "courseCard.status.active",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  upcoming: {
    labelKey: "courseCard.status.upcoming",
    pillClass: "bg-orange-100 text-orange-700",
  },
  archived: {
    labelKey: "courseCard.status.archived",
    pillClass: "bg-slate-200 text-slate-700",
  },
};

const coverFallbacks = [
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=70",
];

function formatCurrency(value, currency = "BDT", language = "en") {
  const locale = language === "bn" ? "bn-BD" : "en-US";
  return `${new Intl.NumberFormat(locale).format(Number(value || 0))} ${currency}`;
}

export default function CourseCatalogCard({
  course,
  index = 0,
  showApplyAction = false,
  showModifyAction = false,
  onModify = null,
  enrollmentStatus = "",
  showEnrollmentStatus = false,
}) {
  const { language, t } = useSiteLanguage();
  const actionCount = 1 + Number(showApplyAction) + Number(showModifyAction);
  const detailsLabel = t("courseCard.seeCourseDetails");
  const meta = statusMeta[course?.status] || statusMeta.archived;
  const bannerUrl =
    course?.banner?.url || course?.thumbnail?.url || coverFallbacks[index % coverFallbacks.length];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[5%] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.16)]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={bannerUrl}
          alt={course?.name || t("courseCard.altCourse")}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/20 to-transparent" />
        <div className="absolute right-4 top-4">
          <span
            className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${meta.pillClass}`}
          >
            {t(meta.labelKey)}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
          {course?.slug || t("courseCard.slugFallback")}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-teal-700">
            <span>{t("courseCard.academicProgram")}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-slate-900 transition group-hover:text-teal-700">
            {course?.name}
          </h2>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
            {course?.description ||
              t("courseCard.descriptionFallback")}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {t("courseCard.monthlyFee")}
            </p>
            <p className="text-base font-black text-slate-900">
              {formatCurrency(course?.monthlyFee, course?.currency || "BDT", language)}
            </p>
          </div>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {course?.currency || "BDT"}
          </p>
        </div>

        <div className={`mt-4 grid gap-1.5 ${actionCount > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link
            href={`/courses/${course?._id}`}
            className={`site-button-primary min-h-9 px-3 whitespace-nowrap ${
              actionCount > 1 ? "text-[9px] tracking-[0.06em]" : "text-[10px] tracking-[0.1em]"
            }`}
          >
            {detailsLabel}
          </Link>

          {showApplyAction ? (
            <Link
              href={`/enrollments?batchId=${course?._id}`}
              className="site-button-secondary min-h-9 px-3 text-[10px] tracking-[0.1em] whitespace-nowrap"
            >
              {t("courseCard.apply")}
            </Link>
          ) : null}

          {showModifyAction ? (
            <button
              type="button"
              onClick={() => onModify?.(course)}
              className="site-button-secondary min-h-9 px-3 text-[10px] tracking-[0.1em] whitespace-nowrap"
            >
              {t("courseCard.modify")}
            </button>
          ) : null}
        </div>

        {showEnrollmentStatus && enrollmentStatus && enrollmentStatus !== "approved" ? (
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            {t("courseCard.enrollmentPrefix")}:{" "}
            {t(`courseCard.enrollmentStatus.${enrollmentStatus}`, enrollmentStatus)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
