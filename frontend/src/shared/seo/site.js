const SITE_NAME = "HSC Academic and Admission Care";
const SITE_SHORT_NAME = "HSC Academic";
const DEFAULT_SITE_DESCRIPTION =
  "Structured HSC and admission preparation with guided courses, disciplined learning workflows, transparent enrollments, and dependable payment operations.";
const DEFAULT_KEYWORDS = [
  "HSC Academic",
  "admission care",
  "HSC preparation",
  "admission coaching Bangladesh",
  "online courses Bangladesh",
  "academic care platform",
  "student payment tracking",
  "batch learning platform",
];
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";
const DEFAULT_API_BASE_URL = "http://localhost:8000/api";

function withLeadingSlash(value = "/") {
  const normalized = String(value || "/").trim();
  if (!normalized) return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function trimTrailingSlash(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  return trimTrailingSlash(configuredUrl);
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function getApiBaseUrl() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL);
}

export function absoluteUrl(path = "/") {
  return new URL(withLeadingSlash(path), getMetadataBase()).toString();
}

function mergeKeywords(extraKeywords = []) {
  return [...new Set([...DEFAULT_KEYWORDS, ...extraKeywords.filter(Boolean)])];
}

function buildRobotsConfig({ noIndex = false } = {}) {
  if (noIndex) {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-video-preview": -1,
        "max-image-preview": "none",
        "max-snippet": -1,
      },
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export function buildSeoMetadata({
  title,
  description = DEFAULT_SITE_DESCRIPTION,
  path = "/",
  canonicalPath,
  keywords = [],
  openGraphType = "website",
  images,
  noIndex = false,
} = {}) {
  const resolvedPath = withLeadingSlash(path);
  const resolvedCanonicalPath = withLeadingSlash(canonicalPath || resolvedPath);
  const resolvedTitle = title || SITE_NAME;
  const resolvedImages =
    images?.length
      ? images
      : [
          {
            url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
            width: 1200,
            height: 630,
            alt: SITE_NAME,
          },
        ];

  return {
    title: resolvedTitle,
    description,
    keywords: mergeKeywords(keywords),
    alternates: {
      canonical: absoluteUrl(resolvedCanonicalPath),
    },
    category: "education",
    robots: buildRobotsConfig({ noIndex }),
    openGraph: {
      title: resolvedTitle,
      description,
      url: absoluteUrl(resolvedCanonicalPath),
      siteName: SITE_NAME,
      locale: "en_US",
      type: openGraphType,
      images: resolvedImages,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: resolvedImages.map((image) => image.url),
    },
  };
}

export function buildNoIndexMetadata({
  title,
  description = "This application page is available to signed-in users only.",
  path = "/",
  canonicalPath,
} = {}) {
  return buildSeoMetadata({
    title,
    description,
    path,
    canonicalPath: canonicalPath || path,
    noIndex: true,
  });
}

export {
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
};
