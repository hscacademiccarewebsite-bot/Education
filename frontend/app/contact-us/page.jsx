"use client";

import { useGetPublicContactQuery } from "@/lib/features/home/homeApi";
import { normalizeWhatsappHref } from "@/lib/utils/whatsapp";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

function getAnchorProps(href = "") {
  if (!href) return {};

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return {
      href,
      target: "_blank",
      rel: "noreferrer",
    };
  }

  return { href };
}

function QuickAction({ label, href, icon: Icon, tone = "emerald" }) {
  const isActive = Boolean(href);
  const Wrapper = isActive ? "a" : "div";
  const palette =
    tone === "slate"
      ? "border-slate-200 bg-white text-slate-700"
      : "border-emerald-200 bg-emerald-50/80 text-emerald-700";

  return (
    <Wrapper
      {...(isActive ? getAnchorProps(href) : {})}
      className={`flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-all ${
        isActive
          ? `${palette} hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`
          : "border-slate-200 bg-slate-100 text-slate-400"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          isActive ? "bg-white/90 shadow-sm" : "bg-white/70"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold">
          {isActive ? label : "N/A"}
        </p>
      </div>
    </Wrapper>
  );
}

function ContactInfoCard({ label, value, href = "", icon: Icon, fallbackText }) {
  const content = value || fallbackText;
  const isActive = Boolean(href && value);
  const Wrapper = isActive ? "a" : "div";

  return (
    <Wrapper
      {...(isActive ? getAnchorProps(href) : {})}
      className={`group flex items-start gap-4 rounded-[24px] border p-4 shadow-sm transition-all sm:p-5 ${
        isActive
          ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900 sm:text-[15px]">
          {content}
        </p>
      </div>

      {isActive ? (
        <div className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-500 sm:flex">
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
        </div>
      ) : null}
    </Wrapper>
  );
}

function ContactUsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-[280px] rounded-[28px] bg-slate-100 animate-pulse sm:h-[320px]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-[72px] rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[108px] rounded-[24px] bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-[320px] rounded-[28px] bg-slate-100 animate-pulse" />
    </div>
  );
}

export default function ContactUsPage() {
  const { data, isLoading, isError } = useGetPublicContactQuery();
  const contact = data?.data;
  const { t } = useSiteLanguage();

  const whatsappLink = normalizeWhatsappHref(contact?.whatsapp);

  return (
    <section className="container-page py-6 sm:py-8 lg:py-12">
      <div className="mb-6 h-1.5 w-24 rounded-full bg-emerald-400 sm:mb-8 sm:w-32" />

      {isLoading ? (
        <ContactUsSkeleton />
      ) : isError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-bold text-rose-700 sm:px-5">
          {t("contactPage.loadError")}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
          <div className="space-y-5">
            <RevealSection noStagger>
              <RevealItem>
                <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#f7fffd_0%,#ffffff_100%)] px-4 py-5 shadow-sm sm:px-6 sm:py-7">
                  <div className="pointer-events-none absolute -right-14 top-0 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl" />
                  <div className="pointer-events-none absolute -left-16 bottom-0 h-28 w-28 rounded-full bg-sky-100/70 blur-3xl" />

                  <div className="relative">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                      {t("contactPage.eyebrow")}
                    </span>

                    <h1 className="mt-5 font-display text-[30px] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-[38px] lg:text-[44px]">
                      <span className="block text-emerald-600">
                        {t("contactPage.accent")}
                      </span>
                      <span className="mt-2 block">
                        {t("contactPage.title")}
                      </span>
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                      {t("contactPage.description")}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {t("contactPage.responseWindow")}
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          {contact?.officeHours || t("contactPage.notAvailable")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {t("contactPage.dailySupport")}
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          {contact?.phone || contact?.email || t("contactPage.notAvailable")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealItem>
            </RevealSection>

            <RevealSection className="space-y-3" noStagger>
              <RevealItem>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {t("contactPage.quickActions", "Quick Actions")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {t("contactPage.quickActionsHint", "Tap the fastest support route for your device.")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <QuickAction
                      label={t("contactPage.labels.phone")}
                      href={contact?.phone ? `tel:${contact.phone}` : ""}
                      icon={Phone}
                    />
                    <QuickAction
                      label={t("contactPage.labels.email")}
                      href={contact?.email ? `mailto:${contact.email}` : ""}
                      icon={Mail}
                    />
                    <QuickAction
                      label={t("contactPage.labels.whatsapp")}
                      href={whatsappLink}
                      icon={MessageCircle}
                      tone="slate"
                    />
                  </div>
                </div>
              </RevealItem>
            </RevealSection>

            <RevealSection className="grid gap-3" noStagger>
              <RevealItem>
                <ContactInfoCard
                  icon={Mail}
                  label={t("contactPage.labels.email")}
                  value={contact?.email}
                  href={contact?.email ? `mailto:${contact.email}` : ""}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <ContactInfoCard
                  icon={Phone}
                  label={t("contactPage.labels.phone")}
                  value={contact?.phone}
                  href={contact?.phone ? `tel:${contact.phone}` : ""}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <ContactInfoCard
                  icon={MapPin}
                  label={t("contactPage.labels.address")}
                  value={contact?.address}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <ContactInfoCard
                  icon={Clock}
                  label={t("contactPage.labels.officeHours")}
                  value={contact?.officeHours}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
            </RevealSection>
          </div>

          <div className="space-y-5">
            <RevealSection noStagger>
              <RevealItem>
                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {t("contactPage.mapTitle", "Visit The Desk")}
                      </p>
                      <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                        {t("contactPage.mapHeading", "Find the official support location")}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        {t(
                          "contactPage.mapDescription",
                          "Use the map for orientation, then confirm the final address and hours from the contact cards above."
                        )}
                      </p>
                    </div>

                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      {t("contactPage.officialChannels", "Official Channels")}
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                    {contact?.mapEmbedUrl ? (
                      <div className="relative min-h-[280px] sm:min-h-[360px]">
                        <iframe
                          title="Location Map"
                          src={contact.mapEmbedUrl}
                          className="absolute inset-0 h-full w-full border-0"
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur-md">
                          {t("contactPage.mapBadge", "Live Location")}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[360px]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <MapPin className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <p className="mt-4 text-base font-black text-slate-900">
                          {t("contactPage.mapUnavailableTitle", "Map not configured")}
                        </p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                          {t(
                            "contactPage.mapUnavailableDescription",
                            "Add the map embed URL from the dashboard to show location guidance here."
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </RevealItem>
            </RevealSection>

            <RevealSection noStagger>
              <RevealItem>
                <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {t("contactPage.officialChannels", "Official Channels")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {t(
                      "contactPage.officialChannelsHint",
                      "Use only the contact paths listed here for admissions, billing, and student support."
                    )}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <ContactInfoCard
                      icon={Facebook}
                      label={t("contactPage.labels.facebook")}
                      value={contact?.facebookPage ? contact.facebookPage.replace(/^https?:\/\//, "") : ""}
                      href={contact?.facebookPage}
                      fallbackText={t("contactPage.notAvailable")}
                    />
                    <ContactInfoCard
                      icon={MessageCircle}
                      label={t("contactPage.labels.whatsapp")}
                      value={contact?.whatsapp}
                      href={whatsappLink}
                      fallbackText={t("contactPage.notAvailable")}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {t("contactPage.asideNote")}
                  </div>
                </div>
              </RevealItem>
            </RevealSection>
          </div>
        </div>
      )}
    </section>
  );
}
