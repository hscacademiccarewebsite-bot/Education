"use client";

import PageHero from "@/components/layouts/PageHero";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicFacultyQuery } from "@/lib/features/home/homeApi";

export default function FacultyPage() {
  const { data, isLoading, isError } = useGetPublicFacultyQuery();
  const faculty = data?.data || [];

  return (
    <section className="container-page py-8 md:py-10">
      <PageHero
        eyebrow="Faculty Network"
        title="Teachers and moderators guiding academic delivery."
        description="This panel reflects the people responsible for content operations, enrollment review, and student support across active and upcoming courses."
        aside={
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
              Active Members
            </p>
            <p className="mt-4 text-4xl font-black text-white">{faculty.length}</p>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Faculty listings are loaded directly from the backend and stay aligned with staff assignments.
            </p>
          </div>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            Failed to load faculty data from backend.
          </div>
        ) : faculty.length === 0 ? (
          <div className="site-panel rounded-[14px] px-6 py-10 text-center">
            <p className="font-display text-2xl font-black text-slate-950">
              No faculty members available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {faculty.map((member, index) => (
              <article
                key={member.id}
                className="site-panel group rounded-[14px] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.14)]"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={
                        member.profilePhotoUrl ||
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=70"
                      }
                      alt={member.fullName}
                      className="h-16 w-16 rounded-[12px] object-cover"
                    />
                    <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-950 text-[10px] font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate text-xl font-black text-slate-950">
                      {member.fullName}
                    </h3>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm leading-7 text-slate-600">
                  {member.email ? <p>{member.email}</p> : null}
                  {member.phone ? <p>{member.phone}</p> : null}
                </div>

                <div className="site-panel-muted mt-5 rounded-[12px] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Assigned Courses
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(member.assignedBatches || []).length ? (
                      member.assignedBatches.map((batch) => (
                        <span
                          key={batch.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700"
                        >
                          {batch.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Not assigned to specific courses</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
