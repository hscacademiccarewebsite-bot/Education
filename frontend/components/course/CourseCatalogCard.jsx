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
    <article className="group relative flex flex-col overflow-hidden rounded-[clamp(12px,2vw,22px)] border border-slate-200 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.012] hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-teal-700">
              <span>{t("courseCard.academicProgram")}</span>
            </div>
            {showEnrollmentStatus && enrollmentStatus && enrollmentStatus !== "approved" ? (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-amber-700">
                {t(`courseCard.enrollmentStatus.${enrollmentStatus}`, enrollmentStatus)}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 line-clamp-2 text-[16px] font-extrabold leading-tight text-slate-900 transition group-hover:text-teal-700">
            {course?.name}
          </h2>
          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-slate-500">
            {course?.description || t("courseCard.descriptionFallback")}
          </p>
        </div>

        <div className="mt-auto">
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

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/courses/${course?._id}`}
              className="site-button-primary min-h-10 text-[10px] tracking-[0.1em]"
            >
              {t("courseCard.seeCourseDetails", "Details")}
            </Link>

            {showApplyAction ? (
              <Link
                href={`/enrollments?batchId=${course?._id}`}
                className="site-button-secondary min-h-10 text-[10px] tracking-[0.1em]"
              >
                {t("courseCard.apply")}
              </Link>
            ) : null}

            {showModifyAction ? (
              <button
                type="button"
                onClick={() => onModify?.(course)}
                className="site-button-secondary min-h-10 text-[10px] tracking-[0.1em]"
              >
                {t("courseCard.modify")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
