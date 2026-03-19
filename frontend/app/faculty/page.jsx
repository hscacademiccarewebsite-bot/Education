"use client";

import Avatar from "@/components/Avatar";
import { RevealItem, RevealSection } from "@/components/motion/MotionReveal";
import { useGetPublicFacultyQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function FacultyCard({ member, t }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar
          src={member.profilePhotoUrl}
          name={member.fullName}
          className="h-14 w-14 rounded-[18px]"
          fallbackClassName="rounded-[18px] bg-slate-900 text-base font-black text-white"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            {member.role}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            {member.fullName}
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            {t("facultyPage.institution")}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-700">
            {member.varsity || t("contactPage.notAvailable")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            {t("facultyPage.experience")}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-700">
            {member.experience || t("contactPage.notAvailable")}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
          {t("facultyPage.assignedCourses")}
        </p>
        <div className="flex flex-wrap gap-2">
          {member.assignedBatches?.length ? (
            member.assignedBatches.map((batch) => (
              <span
                key={batch.id}
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700"
              >
                {batch.name}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">{t("facultyPage.notAssigned")}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function FacultyPage() {
  const { t } = useSiteLanguage();
  const { data, isLoading, isError } = useGetPublicFacultyQuery();
  const faculty = data?.data || [];

  return (
    <section className="container-page py-8 md:py-12">
      <RevealSection noStagger className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_#eff6ff_0%,_#ffffff_52%,_#ecfdf5_100%)] px-5 py-7 shadow-[0_12px_36px_rgba(15,23,42,0.06)] md:px-8 md:py-10">
        <RevealItem>
          <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
            {t("facultyPage.eyebrow")}
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-[44px]">
            <span className="text-sky-600">{t("facultyPage.accent")}</span>{" "}
            {t("facultyPage.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            {t("facultyPage.description")}
          </p>
          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
            {faculty.length} {t("facultyPage.activeMembers")}
          </div>
        </RevealItem>
      </RevealSection>

      {isError ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {t("facultyPage.loadError")}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[24px] bg-slate-100" />
          ))}
        </div>
      ) : faculty.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-lg font-black text-slate-900">{t("facultyPage.empty")}</p>
        </div>
      ) : (
        <RevealSection className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member) => (
            <RevealItem key={member.id}>
              <FacultyCard member={member} t={t} />
            </RevealItem>
          ))}
        </RevealSection>
      )}
    </section>
  );
}
