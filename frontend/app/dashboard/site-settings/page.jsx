"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/layouts/PageHero";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { InlineLoader } from "@/components/loaders/AppLoader";
import {
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} from "@/lib/features/home/homeApi";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";
}

function toHighlightsText(highlights) {
  if (!Array.isArray(highlights)) {
    return "";
  }
  return highlights.filter(Boolean).join("\n");
}

function splitHighlights(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

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
  aboutHeading: "",
  aboutDescription: "",
  aboutMission: "",
  aboutHighlights: "",
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
    <article className="site-panel rounded-[32px] p-5 md:p-6">
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
  const [success, setSuccess] = useState("");

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
      aboutHeading: settings?.about?.heading || "",
      aboutDescription: settings?.about?.description || "",
      aboutMission: settings?.about?.mission || "",
      aboutHighlights: toHighlightsText(settings?.about?.highlights),
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
      return "Not updated yet";
    }
    return new Date(metadata.updatedAt).toLocaleString();
  }, [metadata?.updatedAt]);

  const previewHighlights = useMemo(() => splitHighlights(form.aboutHighlights), [form.aboutHighlights]);

  const onSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      general: {
        siteName: form.siteName.trim(),
        siteTagline: form.siteTagline.trim(),
        footerText: form.footerText.trim(),
        footerCopyright: form.footerCopyright.trim(),
        footerLinks: parseFooterLinksText(form.footerLinks),
      },
      about: {
        heading: form.aboutHeading.trim(),
        description: form.aboutDescription.trim(),
        mission: form.aboutMission.trim(),
        highlights: splitHighlights(form.aboutHighlights),
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
      setSuccess("Site settings updated successfully.");
      setForm((prev) => ({ ...prev, logoTouched: false }));
    } catch (saveError) {
      setError(normalizeApiError(saveError));
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <PageHero
          eyebrow="Admin Control"
          title="Manage the entire site experience."
          description="Update brand identity, homepage narrative, contact channels, and global footer content from one controlled workspace."
          actions={
            <>
              <button type="button" onClick={() => refetch()} className="site-button-secondary">
                Refresh
              </button>
              <Link href="/dashboard/slider-control" className="site-button-secondary">
                Slider Control
              </Link>
              <Link href="/dashboard" className="site-button-primary">
                Back To Dashboard
              </Link>
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Last Updated</p>
                <p className="mt-2 text-sm font-semibold text-white">{lastUpdatedText}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Hero Slides</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {Number(metadata?.heroSlidesCount || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Active Brand</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {form.siteName || "HSC Academic & Admission Care"}
                </p>
              </div>
            </div>
          }
        />

        <div className="mt-6 space-y-4">
          {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
          {success ? <MessageBanner tone="success">{success}</MessageBanner> : null}
        </div>

        {isLoading ? (
          <div className="site-panel mt-8 rounded-[32px] p-6">
            <InlineLoader label="Loading site settings..." />
          </div>
        ) : isError ? (
          <div className="mt-8">
            <MessageBanner tone="error">Failed to load site settings.</MessageBanner>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onSave}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
              <div className="space-y-6">
                <SectionCard
                  eyebrow="Brand System"
                  title="General Branding"
                  description="Define the name, tagline, footer statement, and logo asset used across the public-facing site."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Site Name
                      </label>
                      <input
                        value={form.siteName}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, siteName: event.target.value }))
                        }
                        className={fieldClass()}
                        placeholder="HSC Academic & Admission Care"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Site Tagline
                      </label>
                      <input
                        value={form.siteTagline}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, siteTagline: event.target.value }))
                        }
                        className={fieldClass()}
                        placeholder="Structured learning for HSC and admission preparation."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Footer Text
                      </label>
                      <textarea
                        value={form.footerText}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, footerText: event.target.value }))
                        }
                        rows={3}
                        className={fieldClass()}
                        placeholder="Footer short note"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Footer Copyright
                      </label>
                      <input
                        value={form.footerCopyright}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, footerCopyright: event.target.value }))
                        }
                        className={fieldClass()}
                        placeholder="All rights reserved."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Footer Links (One Per Line)
                      </label>
                      <textarea
                        value={form.footerLinks}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, footerLinks: event.target.value }))
                        }
                        rows={5}
                        className={fieldClass()}
                        placeholder={"Courses | /courses | auth\nAbout | /about-us\nFaculty | /faculty\nContact | /contact-us"}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Format: <span className="font-bold">Label | /path | auth(optional)</span>
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <ImageUploadField
                        label="Site Logo"
                        folder="hsc-academic/site"
                        asset={form.logoAsset}
                        previewAlt="Site logo"
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
                          className="mt-3 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-100"
                        >
                          Remove Logo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Homepage Narrative"
                  title="About Section"
                  description="Control the institution-level message shown across the public pages."
                >
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Heading
                      </label>
                      <input
                        value={form.aboutHeading}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, aboutHeading: event.target.value }))
                        }
                        className={fieldClass()}
                        placeholder="About heading"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Description
                      </label>
                      <textarea
                        value={form.aboutDescription}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, aboutDescription: event.target.value }))
                        }
                        rows={5}
                        className={fieldClass()}
                        placeholder="About description"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Mission
                      </label>
                      <textarea
                        value={form.aboutMission}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, aboutMission: event.target.value }))
                        }
                        rows={4}
                        className={fieldClass()}
                        placeholder="Mission statement"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Highlights (One Per Line)
                      </label>
                      <textarea
                        value={form.aboutHighlights}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, aboutHighlights: event.target.value }))
                        }
                        rows={6}
                        className={fieldClass()}
                        placeholder={"Curriculum Architecture\nEnrollment Governance\nMonthly payment transparency"}
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard
                  eyebrow="Support Channels"
                  title="Contact Section"
                  description="Keep public contact paths consistent across contact, footer, and support-driven screens."
                >
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Phone
                      </label>
                      <input
                        value={form.contactPhone}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactPhone: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Address
                      </label>
                      <input
                        value={form.contactAddress}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactAddress: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Office Hours
                      </label>
                      <input
                        value={form.contactOfficeHours}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactOfficeHours: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Facebook Page URL
                      </label>
                      <input
                        type="url"
                        value={form.contactFacebookPage}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactFacebookPage: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        WhatsApp URL
                      </label>
                      <input
                        type="url"
                        value={form.contactWhatsapp}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, contactWhatsapp: event.target.value }))
                        }
                        className={fieldClass()}
                      />
                    </div>
                  </div>
                </SectionCard>

                <div className="site-panel-dark rounded-[32px] p-6 text-white">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                    Live Preview
                  </p>
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-4">
                      {form.logoAsset?.url ? (
                        <img
                          src={form.logoAsset.url}
                          alt={form.siteName || "Site logo"}
                          className="h-14 w-14 rounded-2xl bg-white object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white">
                          {(form.siteName || "HSC").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-display text-2xl font-black text-white">
                          {form.siteName || "HSC Academic & Admission Care"}
                        </p>
                        <p className="mt-1 text-sm text-white/70">
                          {form.siteTagline || "Structured learning for HSC and admission preparation."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-white/75">
                      <p>{form.footerText || "Footer note will appear here after save."}</p>
                      <p>
                        © {new Date().getFullYear()} {form.siteName || "HSC Academic & Admission Care"}{" "}
                        {form.footerCopyright || "All rights reserved."}
                      </p>
                      <p>{form.aboutHeading || "About heading preview"}</p>
                      {previewHighlights.length ? (
                        <div className="space-y-2">
                          {previewHighlights.slice(0, 4).map((item) => (
                            <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                              {item}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="site-panel-muted flex flex-wrap items-center justify-between gap-4 rounded-[32px] px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Publish Changes
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Updates apply to homepage, about, contact, and footer content immediately after save.
                </p>
              </div>
              <button type="submit" disabled={saving} className="site-button-primary">
                {saving ? "Saving..." : "Save Site Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </RequireAuth>
  );
}
