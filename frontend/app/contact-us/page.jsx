"use client";

import { useGetPublicContactQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";
import { Mail, Phone, MapPin, Clock, Facebook, MessageCircle, ChevronRight, Send } from "lucide-react";

/**
 * COMPACT CONTACT TILE
 * Professional horizontal-first layout for high density
 */
function CompactContactTile({ label, value, href = "", fallbackText, icon: Icon, isSocial = false }) {
  const content = value || fallbackText;
  const Wrapper = href && value ? "a" : "div";

  return (
    <Wrapper
      {...(href && value ? { href, target: "_blank", rel: "noreferrer" } : {})}
      className="group flex items-center gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-200 hover:bg-white hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {content}
        </p>
      </div>

      {(href && value) && (
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      )}
    </Wrapper>
  );
}

export default function ContactUsPage() {
  const { data, isLoading, isError } = useGetPublicContactQuery();
  const contact = data?.data;
  const { t } = useSiteLanguage();

  return (
    <section className="container-page py-8 md:py-12">
      {/* HEADER: Compact & Refined */}
      <RevealSection noStagger className="mb-8 md:mb-12">
        <RevealItem>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
            <div className="max-w-xl">
              <span className="inline-block rounded-full bg-emerald-100/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                {t("contactPage.eyebrow")}
              </span>
              <h1 className="font-display mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                {t("contactPage.title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {t("contactPage.description")}
              </p>
            </div>
            
            <div className="hidden lg:block">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-950 p-4 pl-6 text-white shadow-xl">
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t("contactPage.responseWindow")}</p>
                   <p className="text-sm font-black text-white">{contact?.officeHours || t("contactPage.dailySupport")}</p>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </RevealItem>
      </RevealSection>

      {/* BODY: Dense 2-Column Grid */}
      <div className="">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
            <div className="lg:col-span-7 h-80 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            {t("contactPage.loadError")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            
            {/* LEFT: Compact Info Stack */}
            <RevealSection className="lg:col-span-5 grid gap-3 content-start">
              <RevealItem>
                <CompactContactTile
                  icon={Mail}
                  label={t("contactPage.labels.email")}
                  value={contact?.email}
                  href={contact?.email ? `mailto:${contact.email}` : ""}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <CompactContactTile
                  icon={Phone}
                  label={t("contactPage.labels.phone")}
                  value={contact?.phone}
                  href={contact?.phone ? `tel:${contact.phone}` : ""}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <CompactContactTile
                  icon={MapPin}
                  label={t("contactPage.labels.address")}
                  value={contact?.address}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              <RevealItem>
                <CompactContactTile
                  icon={Clock}
                  label={t("contactPage.labels.officeHours")}
                  value={contact?.officeHours}
                  fallbackText={t("contactPage.notAvailable")}
                />
              </RevealItem>
              
              <RevealItem>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <CompactContactTile
                    icon={Facebook}
                    label="Facebook"
                    value={contact?.facebookPage ? "Social Page" : null}
                    href={contact?.facebookPage}
                    fallbackText="N/A"
                  />
                  <CompactContactTile
                    icon={MessageCircle}
                    label="WhatsApp"
                    value={contact?.whatsapp ? "Live Chat" : null}
                    href={contact?.whatsapp ? `https://wa.me/${String(contact.whatsapp).replace(/\D/g, "")}` : null}
                    fallbackText="N/A"
                  />
                </div>
              </RevealItem>
            </RevealSection>

            {/* RIGHT: Sophisticated Framed Map */}
            <RevealSection className="lg:col-span-7 h-full min-h-[320px]" noStagger>
              <RevealItem className="h-full">
                <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-emerald-200">
                  {contact?.mapEmbedUrl ? (
                    <iframe
                      title="Location Map"
                      src={contact.mapEmbedUrl}
                      className="absolute inset-0 h-full w-full border-0 contrast-[90%] saturate-[80%] transition-all duration-500 hover:contrast-100 hover:saturate-100"
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-8 bg-slate-50/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                         <MapPin className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Map Not Configured</p>
                    </div>
                  )}
                  {/* Map overlay elements for extra "Premium" feel */}
                  <div className="absolute top-3 left-3 z-10 hidden sm:block">
                     <div className="flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm backdrop-blur-md border border-white/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Location
                     </div>
                  </div>
                </div>
              </RevealItem>
            </RevealSection>

          </div>
        )}
      </div>
    </section>
  );
}
