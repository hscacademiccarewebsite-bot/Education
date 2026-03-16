"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { InlineLoader } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import { FloatingInput, FloatingTextarea } from "@/components/forms/FloatingField";
import {
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} from "@/lib/features/home/homeApi";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */

/** Build a canonical wa.me link from a raw phone number string */
function toWaLink(raw = "") {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function settingsToForm(settings) {
  return {
    gpa5Count: String(settings?.general?.gpa5Count ?? ""),
    publicAdmissionCount: String(settings?.general?.publicAdmissionCount ?? ""),
    contactEmail: settings?.contact?.email || "",
    contactPhone: settings?.contact?.phone || "",
    contactAddress: settings?.contact?.address || "",
    contactOfficeHours: settings?.contact?.officeHours || "",
    contactFacebookPage: settings?.contact?.facebookPage || "",
    contactMapEmbedUrl: settings?.contact?.mapEmbedUrl || "",
    // store as plain number; wa.me link is generated on the fly everywhere
    contactWhatsapp: settings?.contact?.whatsapp || "",
  };
}

const EMPTY_FORM = settingsToForm(null);

function isFormDirty(form, baseline) {
  return Object.keys(form).some((k) => form[k] !== baseline[k]);
}

/* ════════════════════════════════════════════
   SMALL UI COMPONENTS
════════════════════════════════════════════ */

function SectionCard({ eyebrow, title, description, children }) {
  return (
    <article className="site-panel overflow-hidden rounded-[clamp(8px,5%,12px)]">
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">{eyebrow}</p>
        <h2 className="mt-1 text-base font-black text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </article>
  );
}

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function SiteSettingsPage() {
  // ── RTK Query (Redux) ──────────────────────────────────────
  const isInitialized = useSelector(selectIsAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { data, isLoading, isError, refetch } = useGetAdminSiteSettingsQuery(undefined, {
    skip: !isInitialized || !isAuthenticated,
  });
  const [updateSiteSettings, { isLoading: saving }] = useUpdateAdminSiteSettingsMutation();

  // ── Local form state ───────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  // Baseline tracks what was last loaded from the server
  const [baseline, setBaseline] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState("");
  const { showSuccess, showError, popupNode } = useActionPopup();
  const { language } = useSiteLanguage();

  const settings = data?.data;
  const metadata = settings?.metadata || {};

  // ── Sync Redux data → form whenever the server response changes ──
  useEffect(() => {
    if (!settings) return;
    const initialForm = settingsToForm(settings);
    setForm(initialForm);
    setBaseline(initialForm);
  }, [settings]);

  const lastUpdatedText = useMemo(() => {
    if (!metadata?.updatedAt) return "Not saved yet";
    return new Date(metadata.updatedAt).toLocaleString(language === "bn" ? "bn-BD" : "en-US");
  }, [language, metadata?.updatedAt]);

  // ── Dirty detection ────────────────────────────────────────
  const isDirty = useMemo(() => isFormDirty(form, baseline), [form, baseline]);

  // ── Field helper ───────────────────────────────────────────
  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  // ── Save ────────────────────────────────────────────────────
  const onSave = async (event) => {
    event.preventDefault();
    if (!isDirty) return;
    setSaveError("");

    let finalMapUrl = form.contactMapEmbedUrl.trim();
    const iframeMatch = finalMapUrl.match(/src=["']([^"']+)["']/);
    if (iframeMatch) {
      finalMapUrl = iframeMatch[1];
    }

    const payload = {
      general: {
        gpa5Count: parseInt(form.gpa5Count, 10) || 0,
        publicAdmissionCount: parseInt(form.publicAdmissionCount, 10) || 0,
      },
      contact: {
        email: form.contactEmail.trim(),
        phone: form.contactPhone.trim(),
        address: form.contactAddress.trim(),
        officeHours: form.contactOfficeHours.trim(),
        facebookPage: form.contactFacebookPage.trim(),
        mapEmbedUrl: finalMapUrl,
        // Store raw number; wa.me links are constructed on-the-fly in the UI
        whatsapp: form.contactWhatsapp.replace(/\D/g, ""),
      },
    };

    try {
      await updateSiteSettings(payload).unwrap();
      showSuccess("Settings saved successfully.");
      // Commit new baseline so button disables again
      setBaseline(settingsToForm({
        general: {
          gpa5Count: payload.general.gpa5Count,
          publicAdmissionCount: payload.general.publicAdmissionCount,
        },
        contact: {
          email: payload.contact.email,
          phone: payload.contact.phone,
          address: payload.contact.address,
          officeHours: payload.contact.officeHours,
          facebookPage: payload.contact.facebookPage,
          mapEmbedUrl: payload.contact.mapEmbedUrl,
          whatsapp: payload.contact.whatsapp,
        },
      }));
    } catch (err) {
      const msg = normalizeApiError(err);
      setSaveError(msg);
      showError(msg);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white px-6 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.07)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Admin</p>
            <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
              Site Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last saved: <span className="font-semibold text-slate-700">{lastUpdatedText}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => refetch()} className="site-button-secondary">
              Refresh
            </button>
            <Link href="/dashboard/slider-control" className="site-button-secondary">
              Slider Control
            </Link>
            <Link href="/dashboard" className="site-button-primary">
              Dashboard
            </Link>
          </div>
        </div>



        {/* Error banner */}
        {saveError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {saveError}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 rounded-[clamp(8px,5%,12px)] border border-slate-200 bg-white p-8">
            <InlineLoader label="Loading settings…" />
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            Failed to load settings. Please refresh.
          </div>
        ) : (
          <form className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]" onSubmit={onSave}>
            <div className="space-y-5">

              {/* Hero Stats */}
              <SectionCard
                eyebrow="Homepage"
                title="Hero Statistics"
                description="Shown on the homepage hero as achievement counters. Student count is sourced automatically from the database."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingInput
                    id="gpa5Count"
                    type="number"
                    label="GPA 5 Achieved"
                    hint="e.g. 200"
                    {...field("gpa5Count")}
                  />
                  <FloatingInput
                    id="publicAdmissionCount"
                    type="number"
                    label="Public University Admissions"
                    hint="e.g. 150"
                    {...field("publicAdmissionCount")}
                  />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Active Students count is automatic — no input needed here.
                </p>
              </SectionCard>

              {/* Contact */}
              <SectionCard
                eyebrow="Support"
                title="Contact Information"
                description="Displayed on the Contact Us page and in the site footer."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingInput id="contactEmail" type="email" label="Email" {...field("contactEmail")} />
                  <FloatingInput id="contactPhone" label="Phone" {...field("contactPhone")} />
                  <FloatingTextarea
                    id="contactAddress"
                    label="Address"
                    className="sm:col-span-2"
                    rows={2}
                    {...field("contactAddress")}
                  />
                  <FloatingInput
                    id="contactOfficeHours"
                    label="Office Hours"
                    hint="e.g. Sat–Thu, 9am–9pm"
                    {...field("contactOfficeHours")}
                  />
                  <FloatingInput
                    id="contactFacebookPage"
                    type="url"
                    label="Facebook Page URL"
                    {...field("contactFacebookPage")}
                  />
                  <FloatingTextarea
                    id="contactMapEmbedUrl"
                    label="Google Map Embed URL (iframe src)"
                    className="sm:col-span-2"
                    rows={2}
                    hint="Paste the entire Google Maps iframe embed code or just the src link"
                    {...field("contactMapEmbedUrl")}
                  />
                  <div>
                    <FloatingInput
                      id="contactWhatsapp"
                      type="tel"
                      label="WhatsApp Number"
                      hint="Digits only, e.g. 8801XXXXXXXXX"
                      {...field("contactWhatsapp")}
                    />
                    {form.contactWhatsapp && (
                      <a
                        href={toWaLink(form.contactWhatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L0 24l6.34-1.66a11.89 11.89 0 005.72 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42z" />
                        </svg>
                        Preview: {toWaLink(form.contactWhatsapp)}
                      </a>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
              <div className="site-panel rounded-[clamp(8px,5%,12px)] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Publish
                </p>
                {isDirty ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    Unsaved changes
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No changes to save.</p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Changes apply instantly to the live site after saving.
                </p>
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className={`mt-4 w-full justify-center ${
                    isDirty ? "site-button-primary" : "site-button-secondary opacity-50 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              <div className="rounded-[clamp(8px,5%,12px)] border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  What you can manage
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Homepage achievement stats",
                    "Contact page details & dynamic integrated map",
                    "WhatsApp redirects automatically via wa.me",
                    "Hero slider images (via Slider Control)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </form>
        )}
      </section>
      {popupNode}
    </RequireAuth>
  );
}
