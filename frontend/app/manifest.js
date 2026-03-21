import {
  DEFAULT_SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
} from "@/src/shared/seo/site";

export default function manifest() {
  return {
    id: "/",
    lang: "en-BD",
    dir: "ltr",
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    categories: ["education", "productivity"],
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ececee",
    theme_color: "#147b79",
    prefer_related_applications: false,
    icons: [
      {
        src: "/manifest-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/manifest-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Courses",
        short_name: "Courses",
        description: "Browse courses, batches, subjects, and study content.",
        url: "/courses",
        icons: [
          {
            src: "/manifest-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Account Access",
        short_name: "Login",
        description: "Sign in to continue to your student workspace.",
        url: "/auth",
        icons: [
          {
            src: "/manifest-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Contact",
        short_name: "Contact",
        description: "Open contact information and support options.",
        url: "/contact-us",
        icons: [
          {
            src: "/manifest-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
