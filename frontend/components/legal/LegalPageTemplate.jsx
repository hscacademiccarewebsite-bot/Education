"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  CircleHelp,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ReceiptText,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { RevealItem, RevealSection } from "@/components/motion/MotionReveal";
import { useGetPublicSiteSettingsQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { getLegalLocale } from "@/src/content/legalPageContent";
import { LEGAL_PAGE_ROUTES } from "@/src/content/legalRoutes";

const PAGE_ICONS = {
  helpCenter: CircleHelp,
  privacyPolicy: ShieldCheck,
  termsOfService: Scale,
  studentGuidelines: GraduationCap,
  refundPolicy: ReceiptText,
};

function MetaCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/80 bg-white/90 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:rounded-[20px] sm:px-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] font-bold leading-5 text-slate-900 sm:text-[14px] sm:leading-6">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({ title, items }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <BookOpenCheck className="h-4 w-4" strokeWidth={2.1} />
        </div>
        <h2 className="text-[15px] font-black tracking-tight text-slate-950 sm:text-[16px]">
          {title}
        </h2>
      </div>

      <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[18px] border border-slate-200/80 bg-slate-50/70 px-3.5 py-3"
          >
            <p className="text-[12px] font-semibold leading-5 text-slate-700 sm:text-[13px] sm:leading-6">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section, index }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-24 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[12px] font-black text-emerald-700 sm:h-10 sm:w-10 sm:text-[13px]">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-black leading-[1.2] tracking-tight text-slate-950 sm:text-[18px]">
            {section.title}
          </h2>

          <div className="mt-3 space-y-3">
            {(section.paragraphs || []).map((paragraph) => (
              <p
                key={paragraph}
                className="text-[13px] leading-6 text-slate-600 sm:text-[14px] sm:leading-7"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {section.bullets?.length ? (
            <ul className="mt-4 grid gap-2.5">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2.5 rounded-[16px] border border-slate-200/80 bg-slate-50/70 px-3 py-2.5"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-[12px] font-medium leading-5 text-slate-700 sm:text-[13px] sm:leading-6">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FaqCard({ title, description, faqs }) {
  return (
    <section
      id="faq"
      className="scroll-mt-24 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5"
    >
      <div className="max-w-2xl">
        <h2 className="text-[17px] font-black tracking-tight text-slate-950 sm:text-[20px]">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-600 sm:text-[14px] sm:leading-7">
          {description}
        </p>
      </div>

      <div className="mt-4 space-y-2.5 sm:mt-5">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-[18px] border border-slate-200 bg-slate-50/60 px-4 py-3 open:bg-white open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <span className="text-[13px] font-bold leading-6 text-slate-900 sm:text-[14px]">
                {faq.question}
              </span>
              <span className="mt-1 shrink-0 text-[18px] font-semibold text-emerald-600 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 pr-4 text-[12px] leading-6 text-slate-600 sm:text-[13px] sm:leading-7">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ContactAside({ shared, contact }) {
  const hasEmail = Boolean(contact?.email);
  const hasPhone = Boolean(contact?.phone);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
      <h2 className="text-[15px] font-black tracking-tight text-slate-950 sm:text-[16px]">
        {shared.contactTitle}
      </h2>
      <p className="mt-2 text-[12px] leading-6 text-slate-600 sm:text-[13px] sm:leading-6">
        {shared.contactDescription}
      </p>

      <div className="mt-4 space-y-2.5">
        {hasEmail ? (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-start gap-3 rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:border-emerald-200 hover:bg-white"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Mail className="h-4 w-4" strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                {shared.supportEmail}
              </span>
              <span className="mt-1 block break-all text-[12px] font-semibold text-slate-800 sm:text-[13px]">
                {contact.email}
              </span>
            </span>
          </a>
        ) : null}

        {hasPhone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-start gap-3 rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:border-emerald-200 hover:bg-white"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Phone className="h-4 w-4" strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                {shared.supportPhone}
              </span>
              <span className="mt-1 block break-words text-[12px] font-semibold text-slate-800 sm:text-[13px]">
                {contact.phone}
              </span>
            </span>
          </a>
        ) : null}

        {!hasEmail && !hasPhone ? (
          <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-[12px] leading-6 text-slate-600">
            {shared.supportFallback}
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-[18px] border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          {shared.officialChannelsTitle}
        </p>
        <p className="mt-2 text-[12px] leading-6 text-emerald-900/90 sm:text-[13px]">
          {shared.officialChannelsBody}
        </p>
      </div>

      <Link
        href="/contact-us"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,var(--action-start),var(--action-end))] px-4 py-3 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(20,123,121,0.18)] transition hover:-translate-y-0.5"
      >
        {shared.contactButton}
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
      </Link>
    </div>
  );
}

function TocCard({ title, sections, faqTitle }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
      <h2 className="text-[15px] font-black tracking-tight text-slate-950 sm:text-[16px]">
        {title}
      </h2>

      <div className="mt-3 space-y-1.5">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex items-start justify-between gap-3 rounded-[14px] px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700 sm:text-[13px]"
          >
            <span>{section.title}</span>
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.1} />
          </a>
        ))}

        {faqTitle ? (
          <a
            href="#faq"
            className="flex items-start justify-between gap-3 rounded-[14px] px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700 sm:text-[13px]"
          >
            <span>{faqTitle}</span>
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.1} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function RelatedPagesCard({ title, relatedPages }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
      <h2 className="text-[15px] font-black tracking-tight text-slate-950 sm:text-[16px]">
        {title}
      </h2>

      <div className="mt-3 space-y-2.5">
        {relatedPages.map((page) => {
          const Icon = PAGE_ICONS[page.key] || FileText;

          return (
            <Link
              key={page.key}
              href={page.href}
              className="flex items-start gap-3 rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <Icon className="h-4 w-4" strokeWidth={2.1} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-slate-900 sm:text-[13px]">
                  {page.title}
                </span>
                <span className="mt-1 block text-[11px] leading-5 text-slate-500 sm:text-[12px]">
                  {page.eyebrow}
                </span>
              </span>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2.1} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function LegalPageTemplate({ pageKey }) {
  const { language } = useSiteLanguage();
  const { data } = useGetPublicSiteSettingsQuery();
  const locale = useMemo(() => getLegalLocale(language), [language]);
  const shared = locale.shared;
  const page = locale.pages[pageKey];
  const contact = data?.data?.contact || {};
  const Icon = PAGE_ICONS[pageKey] || FileText;

  const relatedPages = useMemo(
    () =>
      (page.related || []).map((key) => ({
        key,
        href: LEGAL_PAGE_ROUTES[key],
        title: locale.pages[key]?.title,
        eyebrow: locale.pages[key]?.eyebrow,
      })),
    [locale.pages, page.related]
  );

  const coverageLabel = language === "bn" ? "প্রযোজ্য ক্ষেত্র" : "Coverage";

  if (!page) {
    return null;
  }

  return (
    <section className="container-page py-5 sm:py-8 lg:py-12">
      <RevealSection className="space-y-4 sm:space-y-5" noStagger>
        <RevealItem>
          <div className="overflow-hidden rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,#f6fffd_0%,#ffffff_100%)] p-4 shadow-sm sm:rounded-[28px] sm:p-6 lg:p-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-start">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm sm:text-[10px]">
                  {page.eyebrow}
                </span>

                <div className="mt-4 flex items-start gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-emerald-100 text-emerald-700 sm:h-12 sm:w-12 sm:rounded-[20px]">
                    <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.1} />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-[26px] font-black leading-[1.08] tracking-tight text-slate-950 sm:text-[34px] lg:text-[40px]">
                      {page.title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-[13px] leading-6 text-slate-600 sm:text-[15px] sm:leading-7">
                      {page.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                <MetaCard label={shared.lastReviewedLabel} value={shared.effectiveDate} />
                <MetaCard label={coverageLabel} value={page.coverage} />
              </div>
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="space-y-4 sm:space-y-5">
              <SummaryCard title={shared.quickSummary} items={page.summary} />

              {page.sections.map((section, index) => (
                <SectionCard key={section.id} section={section} index={index} />
              ))}

              {page.faqs?.length ? (
                <FaqCard
                  title={shared.faqTitle}
                  description={shared.faqDescription}
                  faqs={page.faqs}
                />
              ) : null}
            </div>

            <div className="space-y-4 xl:sticky xl:top-24">
              <TocCard
                title={shared.onThisPage}
                sections={page.sections}
                faqTitle={page.faqs?.length ? shared.faqTitle : ""}
              />
              <ContactAside shared={shared} contact={contact} />
              <RelatedPagesCard title={shared.relatedPages} relatedPages={relatedPages} />
            </div>
          </div>
        </RevealItem>
      </RevealSection>
    </section>
  );
}
