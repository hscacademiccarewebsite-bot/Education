"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import { useGetPublicSiteSettingsQuery } from "@/lib/features/home/homeApi";
import { normalizeWhatsappHref } from "@/lib/utils/whatsapp";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { LEGAL_PAGE_ROUTES } from "@/src/content/legalRoutes";

const DEFAULT_FOOTER_LINKS = [
  { href: "/courses", labelKey: "navbar.courses", requiresAuth: true },

  { href: "/faculty", labelKey: "navbar.faculty" },
  { href: "/contact-us", labelKey: "navbar.contact" },
];

export default function SiteFooter() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const { t } = useSiteLanguage();
  const { data } = useGetPublicSiteSettingsQuery();
  const general = data?.data?.general || {};
  const contact = data?.data?.contact || {};

  const configuredLinks = useMemo(() => {
    if (!Array.isArray(general?.footerLinks)) {
      return [];
    }

    return general.footerLinks
      .map((item) => ({
        label: String(item?.label || "").trim(),
        href: String(item?.href || "").trim(),
        requiresAuth: Boolean(item?.requiresAuth),
      }))
      .filter((item) => item.label && item.href && item.href.startsWith("/"));
  }, [general?.footerLinks]);

  const footerDescription =
    general.footerText ||
    general.siteTagline ||
    t("footer.defaultDescription");
  const footerCopyright = general.footerCopyright || t("footer.defaultCopyright");
  const footerSiteName = "HSC Academic & Admission Care";
  const footerLinksSource = configuredLinks.length ? configuredLinks : DEFAULT_FOOTER_LINKS;

  const footerLinks = useMemo(
    () =>
      footerLinksSource.filter((item) => {
        if (!item.requiresAuth) {
          return true;
        }
        return isInitialized && isAuthenticated;
      }),
    [footerLinksSource, isAuthenticated, isInitialized]
  );

  const socialLinks = [
    {
      id: "facebook",
      href: contact.facebookPage,
      label: t("footer.facebook"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.025 4.388 11.021 10.125 11.927v-8.438H7.078v-3.49h3.047V9.41c0-3.017 1.792-4.686 4.533-4.686 1.312 0 2.686.235 2.686.235v2.961H15.83c-1.49 0-1.956.931-1.956 1.887v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.098 24 12.073z" />
        </svg>
      ),
    },
    {
      id: "whatsapp",
      href: normalizeWhatsappHref(contact.whatsapp),
      label: t("footer.whatsapp"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L0 24l6.34-1.66a11.89 11.89 0 005.72 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42zM12.07 21.8h-.01a9.88 9.88 0 01-5.02-1.37l-.36-.22-3.76.99 1-3.67-.24-.38a9.89 9.89 0 01-1.5-5.26c0-5.46 4.45-9.9 9.91-9.9 2.65 0 5.13 1.03 6.99 2.9a9.84 9.84 0 012.9 7c0 5.46-4.44 9.91-9.9 9.91zm5.43-7.43c-.3-.15-1.76-.87-2.03-.97-.28-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.34.45-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.19-.57-.34z" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(item.href));

  const contactRows = [
    {
      id: "email",
      value: contact.email,
      iconPath:
        "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    },
    {
      id: "phone",
      value: contact.phone,
      iconPath:
        "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
    },
    {
      id: "address",
      value: contact.address,
      iconPath:
        "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
    },
    {
      id: "officeHours",
      value: contact.officeHours,
      iconPath:
        "M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z",
    },
  ].filter((item) => Boolean(item.value));

  return (
    <footer className="relative mt-10 w-full overflow-hidden text-slate-100">
      <div className="relative w-full overflow-hidden">
        <div
          className="h-[132px] bg-[url('/footer%20image.png')] bg-repeat-x bg-bottom bg-[length:auto_132px] md:h-[148px] md:bg-[length:auto_148px]"
          aria-hidden="true"
        />
      </div>

      <div className="relative bg-[rgb(39,37,42)]">
        <div className="container-page relative py-8 md:py-10">
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-12 md:gap-y-16">
            <div className="lg:col-span-4">
              <p className="font-display text-3xl font-extrabold tracking-tight text-emerald-100">
                {footerSiteName}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                We will keep our promises
              </p>
              {mounted && socialLinks.length ? (
                <div className="mt-8 flex flex-wrap gap-4">
                  {socialLinks.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 ring-1 ring-white/10 transition-all hover:bg-[linear-gradient(135deg,var(--action-start),var(--action-end))] hover:text-white hover:ring-[var(--action-start)]"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-2">
              <p className="font-display text-[13px] font-black uppercase tracking-[0.14em] text-emerald-100">
                {t("footer.explore")}
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {mounted && footerLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex text-sm text-slate-400 transition hover:-translate-y-0.5 hover:text-emerald-400"
                    >
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-100">
                {t("footer.resources")}
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  { href: LEGAL_PAGE_ROUTES.helpCenter, label: t("footer.helpCenter") },
                  { href: LEGAL_PAGE_ROUTES.privacyPolicy, label: t("footer.privacyPolicy") },
                  { href: LEGAL_PAGE_ROUTES.termsOfService, label: t("footer.termsOfService") },
                  { href: LEGAL_PAGE_ROUTES.studentGuidelines, label: t("footer.studentGuidelines") },
                  { href: LEGAL_PAGE_ROUTES.refundPolicy, label: t("footer.refundPolicy") },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="inline-flex text-sm text-slate-400 transition hover:-translate-y-0.5 hover:text-emerald-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-100">
                {t("footer.contactInfo")}
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                {mounted && contactRows.length ? (
                  contactRows.map((row) => (
                    <li key={row.id} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-emerald-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={row.iconPath} />
                        </svg>
                      </span>
                      <span className="text-sm leading-relaxed text-slate-400">
                        {row.value}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">
                    {t("footer.contactFallback")}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {mounted ? new Date().getFullYear() : ""} {footerSiteName}. {mounted ? footerCopyright : ""}
            </p>
            <p className="text-sm tracking-wide text-slate-500">
              {t("footer.developedBy")}{" "}

              <a
                href="https://shuvochakma.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-500 transition hover:text-emerald-400"
              >
                Shuvo Chakma
              </a>

              {" & "}

              <a
                href="https://chtdevelopers.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-500 transition hover:text-emerald-400"
              >
                CHT Developers
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
