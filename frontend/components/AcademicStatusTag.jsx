"use client";

import { getAcademicStatusLabelMeta } from "@/lib/utils/roleUtils";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const STATUS_STYLES = {
  student: "border-amber-200 bg-amber-50 text-amber-700",
  ex_student: "border-slate-200 bg-slate-100 text-slate-700",
  normal_user: "border-sky-200 bg-sky-50 text-sky-700",
};

export default function AcademicStatusTag({ status, showNormalUser = false, className = "" }) {
  if (!status || (status === "normal_user" && !showNormalUser)) {
    return null;
  }

  const { t } = useSiteLanguage();
  const meta = getAcademicStatusLabelMeta(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ${
        STATUS_STYLES[status] || STATUS_STYLES.normal_user
      } ${className}`.trim()}
    >
      {t(meta.key, meta.defaultLabel)}
    </span>
  );
}
