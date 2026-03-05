"use client";

import { useGetPublicFacultyQuery } from "@/lib/features/home/homeApi";
import { CourseCardSkeleton } from "@/components/loaders/AppLoader";

export default function FacultyPage() {
  const { data, isLoading, isError } = useGetPublicFacultyQuery();
  const faculty = data?.data || [];

  return (
    <section className="container-page py-10">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Faculty</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
          Teacher & Moderator Panel
        </h1>
      </div>

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
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-bold text-slate-900">No faculty members available.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start gap-3">
                <img
                  src={
                    member.profilePhotoUrl ||
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=70"
                  }
                  alt={member.fullName}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                    {member.fullName}
                  </h3>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700">
                    {member.role}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                {member.email ? <p>Email: {member.email}</p> : null}
                {member.phone ? <p>Phone: {member.phone}</p> : null}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned Courses</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(member.assignedBatches || []).length ? (
                    member.assignedBatches.map((batch) => (
                      <span
                        key={batch.id}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
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
    </section>
  );
}
