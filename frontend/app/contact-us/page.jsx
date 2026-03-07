"use client";

import PageHero from "@/components/layouts/PageHero";
import { CardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicContactQuery } from "@/lib/features/home/homeApi";

function ContactTile({ label, value, href = "" }) {
  const content = value || "Not available";

  return (
    <article className="site-panel-muted rounded-[14px] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {href && value ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold leading-7 text-teal-800 underline"
        >
          {content}
        </a>
      ) : (
        <p className="mt-3 text-sm leading-7 text-slate-700">{content}</p>
      )}
    </article>
  );
}

export default function ContactUsPage() {
  const { data, isLoading, isError } = useGetPublicContactQuery();
  const contact = data?.data;

  return (
    <section className="container-page py-8 md:py-10">
      <PageHero
        eyebrow="Reach The Team"
        title="Support, enrollment, and academic guidance."
        description="Whether you need help with admissions, batch enrollment, payment follow-up, or course navigation, this is the operational contact layer of the platform."
        aside={
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
              Response Window
            </p>
            <p className="mt-4 text-3xl font-black text-white">
              {contact?.officeHours || "Daily Support"}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Keep official support channels updated here so every page reflects the same information.
            </p>
          </div>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <CardSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            Failed to load contact data from backend.
          </div>
        ) : (
          <div className="site-grid md:grid-cols-2 xl:grid-cols-3">
            <ContactTile label="Email" value={contact?.email} href={contact?.email ? `mailto:${contact.email}` : ""} />
            <ContactTile label="Phone" value={contact?.phone} href={contact?.phone ? `tel:${contact.phone}` : ""} />
            <ContactTile label="Address" value={contact?.address} />
            <ContactTile label="Office Hours" value={contact?.officeHours} />
            <ContactTile label="Facebook Page" value={contact?.facebookPage} href={contact?.facebookPage} />
            <ContactTile label="WhatsApp" value={contact?.whatsapp} href={contact?.whatsapp} />
          </div>
        )}
      </div>
    </section>
  );
}
