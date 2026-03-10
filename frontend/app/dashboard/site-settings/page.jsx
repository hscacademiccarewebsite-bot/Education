"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { InlineLoader } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
import {
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} from "@/lib/features/home/homeApi";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function toFooterLinksText(links) {
  if (!Array.isArray(links)) {
    return "";
  }

  return links
    .map((link) => {
      const label = String(link?.label || "").trim();
      const href = String(link?.href || "").trim();
      if (!label || !href) {
        return "";
      }
      return `${label} | ${href}${link?.requiresAuth ? " | auth" : ""}`;
    })
    .filter(Boolean)
    .join("\n");
}

function parseFooterLinksText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, hrefPart, accessPart] = line.split("|").map((item) => item.trim());
      const label = String(labelPart || "").trim();
      const href = String(hrefPart || "").trim();
      if (!label || !href) {
        return null;
      }
      if (!href.startsWith("/")) {
        return null;
      }
      return {
        label,
        href,
        requiresAuth: /^(auth|private|protected|member)$/i.test(String(accessPart || "")),
      };
    })
    .filter(Boolean);
}

const EMPTY_FORM = {
  siteName: "",
  siteTagline: "",
  footerText: "",
  footerCopyright: "",
  footerLinks: "",
  logoAsset: null,
  logoTouched: false,
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  contactOfficeHours: "",
  contactFacebookPage: "",
  contactWhatsapp: "",
};

function MessageBanner({ tone, children }) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>
      {children}
    </div>
  );
}

function SectionCard({ eyebrow, title, description, children }) {
  return (
    <article className="site-panel rounded-[clamp(8px,5%,12px)] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
          <h2 className="font-display mt-3 text-2xl font-black text-slate-950">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

export default function SiteSettingsPage() {
  const { data, isLoading, isError, refetch } = useGetAdminSiteSettingsQuery();
  const [updateSiteSettings, { isLoading: saving }] = useUpdateAdminSiteSettingsMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();
  const { t, language } = useSiteLanguage();

  const settings = data?.data;
  const metadata = settings?.metadata || {};

  useEffect(() => {
    if (!settings) {
      return;
    }

    setForm({
      siteName: settings?.general?.siteName || "",
      siteTagline: settings?.general?.siteTagline || "",
      footerText: settings?.general?.footerText || "",
      footerCopyright: settings?.general?.footerCopyright || "",
      footerLinks: toFooterLinksText(settings?.general?.footerLinks),
      logoAsset: settings?.general?.logoUrl
        ? {
            url: settings.general.logoUrl,
            publicId: settings?.general?.logo?.publicId || "",
          }
        : null,
      logoTouched: false,
      contactEmail: settings?.contact?.email || "",
      contactPhone: settings?.contact?.phone || "",
      contactAddress: settings?.contact?.address || "",
      contactOfficeHours: settings?.contact?.officeHours || "",
      contactFacebookPage: settings?.contact?.facebookPage || "",
      contactWhatsapp: settings?.contact?.whatsapp || "",
    });
  }, [settings]);

  const lastUpdatedText = useMemo(() => {
    if (!metadata?.updatedAt) {
      return t("siteSettingsPage.notUpdatedYet");
    }
    return new Date(metadata.updatedAt).toLocaleString(language === "bn" ? "bn-BD" : "en-US");
  }, [language, metadata?.updatedAt, t]);

  const footerLinkCount = useMemo(
    () => parseFooterLinksText(form.footerLinks).length,
    [form.footerLinks]
  );

  const onSave = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      general: {
        siteName: form.siteName.trim(),
        siteTagline: form.siteTagline.trim(),
        footerText: form.footerText.trim(),
        footerCopyright: form.footerCopyright.trim(),
        footerLinks: parseFooterLinksText(form.footerLinks),
      },
      contact: {
        email: form.contactEmail.trim(),
        phone: form.contactPhone.trim(),
        address: form.contactAddress.trim(),
        officeHours: form.contactOfficeHours.trim(),
        facebookPage: form.contactFacebookPage.trim(),
        whatsapp: form.contactWhatsapp.trim(),
      },
    };

    if (form.logoTouched) {
      if (form.logoAsset?.url) {
        payload.general.logo = {
          url: form.logoAsset.url,
          publicId: form.logoAsset.publicId || "",
        };
      } else {
        payload.general.removeLogo = true;
      }
    }

    try {
      await updateSiteSettings(payload).unwrap();
      showSuccess(t("siteSettingsPage.messages.updated"));
      setForm((prev) => ({ ...prev, logoTouched: false }));
    } catch (saveError) {
      const resolvedError = normalizeApiError(saveError);
      setError(resolvedError);
      showError(resolvedError);
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <section className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="site-kicker">{t("siteSettingsPage.kicker")}</p>
              <h1 className="site-title mt-4">{t("siteSettingsPage.title")}</h1>
              <p className="site-lead mt-4 max-w-3xl">
                {t("siteSettingsPage.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => refetch()} className="site-button-secondary">
                {t("siteSettingsPage.refresh")}
              </button>
              <Link href="/dashboard/slider-control" className="site-button-secondary">
                {t("siteSettingsPage.sliderControl")}
              </Link>
              <Link href="/dashboard" className="site-button-primary">
                {t("navbar.dashboard")}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("siteSettingsPage.stats.lastUpdated")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{lastUpdatedText}</p>
            </div>
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("siteSettingsPage.stats.heroSlides")}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{Number(metadata?.heroSlidesCount || 0)}</p>
            </div>
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("siteSettingsPage.stats.footerLinks")}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{footerLinkCount}</p>
            </div>
            <div className="rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t("siteSettingsPage.stats.activeBrand")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {form.siteName || t("siteSettingsPage.defaultSiteName")}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-4">
          {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
        </div>

        {isLoading ? (
          <div className="site-panel mt-8 rounded-[clamp(8px,5%,12px)] p-6">
            <InlineLoader label={t("siteSettingsPage.loading")} />
          </div>
        ) : isError ? (
          <div className="mt-8">
            <MessageBanner tone="error">{t("siteSettingsPage.loadError")}</MessageBanner>
          </div>
        ) : (
          <form className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={onSave}>
            <div className="space-y-6">
              <SectionCard
                eyebrow={t("siteSettingsPage.brandSystem")}
                title={t("siteSettingsPage.generalBranding")}
                description={t("siteSettingsPage.generalBrandingDesc")}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FloatingInput
                    label={t("siteSettingsPage.fields.siteName")}
                    value={form.siteName}
                    onChange={(event) => setForm((prev) => ({ ...prev, siteName: event.target.value }))}
                    hint={t("siteSettingsPage.defaultSiteName")}
                  />

                  <FloatingInput
                    label={t("siteSettingsPage.fields.siteTagline")}
                    value={form.siteTagline}
                    onChange={(event) => setForm((prev) => ({ ...prev, siteTagline: event.target.value }))}
                    hint={t("siteSettingsPage.defaultTagline")}
                  />

                  <FloatingTextarea
                    label={t("siteSettingsPage.fields.footerText")}
                    className="md:col-span-2"
                    value={form.footerText}
                    onChange={(event) => setForm((prev) => ({ ...prev, footerText: event.target.value }))}
                    rows={3}
                    hint={t("siteSettingsPage.footerShortNote")}
                  />

                  <FloatingInput
                    label={t("siteSettingsPage.fields.footerCopyright")}
                    className="md:col-span-2"
                    value={form.footerCopyright}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, footerCopyright: event.target.value }))
                    }
                    hint={t("footer.defaultCopyright")}
                  />

                  <div className="md:col-span-2">
                    <FloatingTextarea
                      label={t("siteSettingsPage.fields.footerLinks")}
                      value={form.footerLinks}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, footerLinks: event.target.value }))
                      }
                      rows={5}
                      hint={t("siteSettingsPage.footerLinksHint")}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {t("siteSettingsPage.formatLabel")}: <span className="font-bold">{t("siteSettingsPage.formatSample")}</span>
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <ImageUploadField
                      label={t("siteSettingsPage.fields.siteLogo")}
                      folder="hsc-academic/site"
                      asset={form.logoAsset}
                      previewAlt={t("siteSettingsPage.siteLogoPreviewAlt")}
                      onChange={(asset) =>
                        setForm((prev) => ({
                          ...prev,
                          logoTouched: true,
                          logoAsset: asset?.url
                            ? { url: asset.url, publicId: asset.publicId || "" }
                            : null,
                        }))
                      }
                    />

                    {form.logoAsset ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            logoTouched: true,
                            logoAsset: null,
                          }))
                        }
                        className="site-button-secondary mt-3 px-4 py-2 text-xs"
                      >
                        {t("siteSettingsPage.removeLogo")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow={t("siteSettingsPage.supportChannels")}
                title={t("siteSettingsPage.contactSection")}
                description={t("siteSettingsPage.contactSectionDesc")}
              >
                <div className="grid gap-4">
                  <FloatingInput
                    type="email"
                    label={t("contactPage.labels.email")}
                    value={form.contactEmail}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  />

                  <FloatingInput
                    label={t("contactPage.labels.phone")}
                    value={form.contactPhone}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  />

                  <FloatingInput
                    label={t("contactPage.labels.address")}
                    value={form.contactAddress}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactAddress: event.target.value }))}
                  />

                  <FloatingInput
                    label={t("contactPage.labels.officeHours")}
                    value={form.contactOfficeHours}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contactOfficeHours: event.target.value }))
                    }
                  />

                  <FloatingInput
                    type="url"
                    label={t("siteSettingsPage.fields.facebookPageUrl")}
                    value={form.contactFacebookPage}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contactFacebookPage: event.target.value }))
                    }
                  />

                  <FloatingInput
                    type="url"
                    label={t("siteSettingsPage.fields.whatsAppUrl")}
                    value={form.contactWhatsapp}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactWhatsapp: event.target.value }))}
                  />
                </div>
              </SectionCard>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
              <div className="site-panel rounded-[clamp(8px,5%,12px)] p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("siteSettingsPage.livePreview")}
                </p>
                <div className="mt-4 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    {form.logoAsset?.url ? (
                      <img
                        src={form.logoAsset.url}
                        alt={form.siteName || t("siteSettingsPage.siteLogoPreviewAlt")}
                        className="h-14 w-14 rounded-2xl bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-lg font-black text-slate-800">
                        {(form.siteName || t("siteSettingsPage.defaultShortName")).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-display text-2xl font-black text-slate-900">
                        {form.siteName || t("siteSettingsPage.defaultSiteName")}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {form.siteTagline || t("siteSettingsPage.defaultTagline")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <p>{form.footerText || t("siteSettingsPage.footerPreviewFallback")}</p>
                    <p>
                      © {new Date().getFullYear()} {form.siteName || t("siteSettingsPage.defaultSiteName")}{" "}
                      {form.footerCopyright || t("footer.defaultCopyright")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="site-panel-muted rounded-[clamp(8px,5%,12px)] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("siteSettingsPage.formattingGuide")}
                </p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>
                    {t("siteSettingsPage.footerLinksLabel")}: <span className="font-semibold">{t("siteSettingsPage.formatSampleShort")}</span>
                  </p>
                  <p>
                    {t("siteSettingsPage.saveAppliesNote")}
                  </p>
                </div>
              </div>

              <div className="site-panel rounded-[clamp(8px,5%,12px)] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("siteSettingsPage.publishChanges")}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {t("siteSettingsPage.publishDescription")}
                </p>
                <button type="submit" disabled={saving} className="site-button-primary mt-4 w-full justify-center">
                  {saving ? t("siteSettingsPage.saving") : t("siteSettingsPage.saveSiteSettings")}
                </button>
              </div>
            </aside>
          </form>
        )}
      </section>
      {popupNode}
    </RequireAuth>
  );
}
