import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import MotionLayout from "@/components/motion/MotionLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicSiteSettingsData } from "@/src/shared/seo/api";
import {
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "@/src/shared/seo/structuredData";
import {
  buildSeoMetadata,
  getMetadataBase,
  SITE_NAME,
  SITE_SHORT_NAME,
} from "@/src/shared/seo/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#147b79",
};

export async function generateMetadata() {
  const siteSettings = await getPublicSiteSettingsData();
  const general = siteSettings?.general || {};
  const contact = siteSettings?.contact || {};
  const description =
    general.siteTagline ||
    "Structured HSC and admission preparation with guided learning, transparent enrollments, and dependable academic support.";

  return {
    metadataBase: getMetadataBase(),
    ...buildSeoMetadata({
      description,
      path: "/",
      keywords: [
        "HSC admission platform",
        "academic learning ecosystem",
        "Bangladesh education platform",
      ],
    }),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    applicationName: SITE_NAME,
    referrer: "origin-when-cross-origin",
    authors: [{ name: SITE_NAME }],
    creator: SITE_SHORT_NAME,
    publisher: SITE_NAME,
    icons: {
      icon: [
        { url: "/icon.png", sizes: "500x500", type: "image/png" },
        { url: "/manifest-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/manifest-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [{ url: "/icon.png", sizes: "500x500", type: "image/png" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: SITE_NAME,
      description,
      url: "/",
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: ["/twitter-image"],
    },
    other: {
      "apple-mobile-web-app-title": SITE_SHORT_NAME,
      "contact:phone_number": contact.phone || undefined,
      "contact:email": contact.email || undefined,
    },
  };
}

export default async function RootLayout({ children }) {
  const siteSettings = await getPublicSiteSettingsData();
  const general = siteSettings?.general || {};
  const contact = siteSettings?.contact || {};
  const description =
    general.siteTagline ||
    "Structured HSC and admission preparation with guided learning, transparent enrollments, and dependable academic support.";
  const schema = [
    buildOrganizationSchema({ general, contact }),
    buildWebsiteSchema({ description }),
  ];

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans text-slate-900 antialiased" suppressHydrationWarning>
        <JsonLd id="root-site-schema" data={schema} />
        <Providers>
          <Navbar />
          <MotionLayout>
            {children}
          </MotionLayout>
        </Providers>
      </body>
    </html>
  );
}
