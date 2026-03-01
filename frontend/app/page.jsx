"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import Navbar from "@/components/Navbar";
import { CardLoader } from "@/components/loaders/AppLoader";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { HOME_ABOUT_PILLARS, HOME_QUICK_LINKS } from "@/lib/features/home/homeData";
import {
  selectHomeFacultyMembers,
  selectHomeRunningBatches,
} from "@/lib/features/home/homeSelectors";

const batchCoverImages = [
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=70",
];

const statusStyles = {
  active: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-orange-100 text-orange-700",
  archived: "bg-slate-200 text-slate-700",
};

function formatCurrency(value, currency = "BDT") {
  const amount = Number(value || 0);
  return `${new Intl.NumberFormat("en-US").format(amount)} ${currency}`;
}

function resolveBatchLink(batchId, isAuthenticated) {
  if (!isAuthenticated || String(batchId).startsWith("public-")) {
    return "/courses";
  }
  return `/courses/${batchId}`;
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="relative overflow-hidden rounded-[34px] border border-white/25 bg-white/10 p-4 shadow-[0_35px_70px_rgba(3,105,161,0.35)] backdrop-blur-md">
        <div className="relative overflow-hidden rounded-[24px]">
          <img
            src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=900&q=70"
            alt="Learning student"
            className="h-[300px] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
              Live Learning
            </p>
            <p className="mt-1 text-lg font-black text-white">Structured Course Experience</p>
          </div>
        </div>
      </div>

      <div className="absolute -left-3 top-[12%] rounded-full bg-emerald-500 p-3 text-white shadow-lg">
        🎓
      </div>
      <div className="absolute -right-4 top-[28%] rounded-full bg-orange-500 p-3 text-white shadow-lg">
        📚
      </div>
      <div className="absolute -left-6 bottom-[16%] rounded-full bg-sky-500 p-3 text-white shadow-lg">
        💡
      </div>
      <div className="absolute -right-2 bottom-[8%] rounded-full bg-cyan-500 p-3 text-white shadow-lg">
        🧪
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="pt-[92px] md:pt-[102px]">
      <div className="container-page py-8 md:py-10">
        <div className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(120deg,#0b3b91_0%,#0f5fb1_35%,#099a8b_72%,#0dbf8c_100%)] px-6 py-8 text-white md:px-10 md:py-10">
          <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl" />

          <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                HSC Academic & Admission Care
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Your Learning,
                <br />
                Reimagined.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-100 md:text-base">
                Master core concepts, prepare for admissions, and stay on track with mentor-led
                course learning. From enrollment to chapter videos, everything runs in one place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="rounded-lg bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-300"
                >
                  Explore Courses
                </Link>
                <Link
                  href="#about-us"
                  className="rounded-lg border border-white/50 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/10"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const runningBatches = useSelector(selectHomeRunningBatches);
  const facultyMembers = useSelector(selectHomeFacultyMembers);

  const { isFetching: batchesFetching } = useListBatchesQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#f2f9f6_55%,#f9fbfd_100%)] text-slate-800">
      <Navbar />

      <HeroSection />

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

        {batchesFetching ? (
          <CardLoader label="Loading running courses..." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {runningBatches.slice(0, 8).map((batch, index) => (
              <article
                key={batch._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]"
              >
                <img
                  src={batchCoverImages[index % batchCoverImages.length]}
                  alt={batch.name}
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                      {batch.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        statusStyles[batch.status] || statusStyles.archived
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {batch.description || "Structured learning with chapter-based class progression."}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Monthly Fee</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatCurrency(batch.monthlyFee, batch.currency || "BDT")}
                    </p>
                  </div>

                  <Link
                    href={resolveBatchLink(batch._id, isAuthenticated)}
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

      <section id="about-us" className="container-page pb-12 md:pb-16">
        <div className="rounded-[28px] border border-cyan-100 bg-white/90 p-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">About Us</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-4xl">
                A complete learning ecosystem for HSC and admission care.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700">
                We organize learning with strong academic structure and operational clarity.
                Students move from Course to Subject to Chapter to Video while faculty handles review,
                monitoring, and consistency.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {HOME_ABOUT_PILLARS.map((pillar) => (
                  <article key={pillar.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-black text-slate-900">{pillar.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{pillar.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[linear-gradient(145deg,#082f49_0%,#0f766e_55%,#10b981_100%)] p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Special Section</p>
              <h3 className="mt-3 text-2xl font-black [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Learning Paths
              </h3>
              <p className="mt-3 text-sm text-slate-100">
                Built for school-level consistency, admission-level practice, and measurable monthly
                progression with faculty guidance.
              </p>

              <div className="mt-5 space-y-2.5">
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm">
                  Board Mastery Track
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm">
                  Engineering Admission Track
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm">
                  Medical Admission Track
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="teacher-panel" className="container-page pb-12 md:pb-16">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Faculty</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif] md:text-3xl">
              Teacher Panel
            </h2>
          </div>
          <Link
            href={isAuthenticated ? "/dashboard" : "/courses"}
            className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            {isAuthenticated ? "Open Dashboard" : "Browse Courses"}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {facultyMembers.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                    {member.fullName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {member.email !== "not-provided" ? member.email : "Email not listed"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black uppercase text-emerald-700">
                  {member.role}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Expertise</p>
                <p className="mt-1 text-sm text-slate-700">{member.expertise}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact-footer" className="border-t border-cyan-100 bg-white">
        <div className="container-page py-12 md:py-14">
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="HSC Academic & Admission Care" className="h-10 w-auto" />
                <h3 className="text-base font-black text-slate-900">HSC Academic Care</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Enterprise-style educational management platform for enrollment, content, and payment flow.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Quick Links</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                {HOME_QUICK_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="transition hover:text-emerald-700">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Services</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                <li>Enrollment Approval Workflow</li>
                <li>Chapter-Wise Learning Delivery</li>
                <li>Monthly Due Management</li>
                <li>Faculty Progress Oversight</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Contact</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                <li>Email: support@hscacademic.care</li>
                <li>Phone: +880 1700-000000</li>
                <li>Dhaka, Bangladesh</li>
                <li>Sat - Thu, 9AM - 9PM</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
            © 2026 HSC Academic & Admission Care. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
