"use client";

import { useGetPublicContactQuery } from "@/lib/features/home/homeApi";
import { CardSkeleton } from "@/components/loaders/AppLoader";

export default function ContactUsPage() {
  const { data, isLoading, isError } = useGetPublicContactQuery();
  const contact = data?.data;

  return (
    <section className="container-page py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Contact Us</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
          We are here to help
        </h1>

        {isLoading ? (
          <div className="mt-5">
            <CardSkeleton />
          </div>
        ) : isError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            Failed to load contact data from backend.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Email</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{contact?.email || "Not available"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Phone</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{contact?.phone || "Not available"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Address</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{contact?.address || "Not available"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Office Hours</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{contact?.officeHours || "Not available"}</p>
            </div>

            {contact?.facebookPage ? (
              <a
                href={contact.facebookPage}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                Visit Facebook Page
              </a>
            ) : null}

            {contact?.whatsapp ? (
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Open WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
