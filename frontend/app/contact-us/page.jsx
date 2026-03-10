"use client";

import PageHero from "@/components/layouts/PageHero";
import { CardSkeleton } from "@/components/loaders/AppLoader";
import { useGetPublicContactQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function ContactTile({ label, value, href = "", fallbackText }) {
  const content = value || fallbackText;

  return (
    <article className="site-panel-muted rounded-[clamp(8px,5%,12px)] p-5">
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
  const { t } = useSiteLanguage();

  return (
    <section className="container-page py-8 md:py-10">
      <PageHero
        eyebrow={t("contactPage.eyebrow")}
        title={t("contactPage.title")}
        description={t("contactPage.description")}
        aside={
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
              {t("contactPage.responseWindow")}
            </p>
            <p className="mt-4 text-3xl font-black text-white">
              {contact?.officeHours || t("contactPage.dailySupport")}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {t("contactPage.asideNote")}
            </p>
          </div>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <CardSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {t("contactPage.loadError")}
          </div>
        ) : (
          <div className="site-grid md:grid-cols-2 xl:grid-cols-3">
            <ContactTile
              label={t("contactPage.labels.email")}
              value={contact?.email}
              href={contact?.email ? `mailto:${contact.email}` : ""}
              fallbackText={t("contactPage.notAvailable")}
            />
            <ContactTile
              label={t("contactPage.labels.phone")}
              value={contact?.phone}
              href={contact?.phone ? `tel:${contact.phone}` : ""}
              fallbackText={t("contactPage.notAvailable")}
            />
            <ContactTile
              label={t("contactPage.labels.address")}
              value={contact?.address}
              fallbackText={t("contactPage.notAvailable")}
            />
            <ContactTile
              label={t("contactPage.labels.officeHours")}
              value={contact?.officeHours}
              fallbackText={t("contactPage.notAvailable")}
            />
            <ContactTile
              label={t("contactPage.labels.facebook")}
              value={contact?.facebookPage}
              href={contact?.facebookPage}
              fallbackText={t("contactPage.notAvailable")}
            />
            <ContactTile
              label={t("contactPage.labels.whatsapp")}
              value={contact?.whatsapp}
              href={contact?.whatsapp}
              fallbackText={t("contactPage.notAvailable")}
            />
          </div>
        )}
      </div>
    </section>
  );
}
