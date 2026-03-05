"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import ImageUploadField from "@/components/uploads/ImageUploadField";
import { InlineLoader } from "@/components/loaders/AppLoader";
import {
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} from "@/lib/features/home/homeApi";

function fieldClass() {
  return "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
}

function parseErrorMessage(error) {
  if (!error) {
    return "Request failed.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error?.data?.message) {
    return error.data.message;
  }
  if (error?.error) {
    return error.error;
  }
  if (error?.message) {
    return error.message;
  }
  return "Request failed.";
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

const EMPTY_FORM = {
  siteName: "",
  siteTagline: "",
  footerText: "",
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

  const onSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      general: {
        siteName: form.siteName.trim(),
        siteTagline: form.siteTagline.trim(),
        footerText: form.footerText.trim(),
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
      setError(parseErrorMessage(saveError));
    }
  };

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <section className="container-page py-8 md:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                Admin Panel
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
                Site Settings
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage global branding, about content, contact details, and footer text from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/slider-control"
                className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
              >
                Manage Slider
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Last Updated</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{lastUpdatedText}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Hero Slides</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {Number(metadata?.heroSlidesCount || 0)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh Settings
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <InlineLoader label="Loading site settings..." />
            </div>
          ) : isError ? (
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              Failed to load site settings.
            </div>
          ) : (
            <form className="mt-6 space-y-6" onSubmit={onSave}>
              <article className="rounded-2xl border border-slate-200 p-4">
                <h2 className="text-lg font-black text-slate-900">General Branding</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Footer Text
                    </label>
                    <textarea
                      value={form.footerText}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, footerText: event.target.value }))
                      }
                      rows={2}
                      className={fieldClass()}
                      placeholder="Footer short note"
                    />
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
                        className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        Remove Logo
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 p-4">
                <h2 className="text-lg font-black text-slate-900">About Section</h2>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Description
                    </label>
                    <textarea
                      value={form.aboutDescription}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, aboutDescription: event.target.value }))
                      }
                      rows={4}
                      className={fieldClass()}
                      placeholder="About description"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Mission
                    </label>
                    <textarea
                      value={form.aboutMission}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, aboutMission: event.target.value }))
                      }
                      rows={3}
                      className={fieldClass()}
                      placeholder="Mission statement"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Highlights (One per line)
                    </label>
                    <textarea
                      value={form.aboutHighlights}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, aboutHighlights: event.target.value }))
                      }
                      rows={5}
                      className={fieldClass()}
                      placeholder={"Curriculum Architecture\nEnrollment Governance\nMonthly payment transparency"}
                    />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 p-4">
                <h2 className="text-lg font-black text-slate-900">Contact Section</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
              </article>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {saving ? "Saving..." : "Save Site Settings"}
                </button>
                <p className="text-xs text-slate-500">
                  Changes apply to homepage/about/contact data instantly after save.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}

