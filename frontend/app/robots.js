import { absoluteUrl } from "@/src/shared/seo/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/analytics",
          "/auth",
          "/community",
          "/dashboard",
          "/enrollments",
          "/notifications",
          "/notes",
          "/payments",
          "/profile",
          "/subjects",
          "/teacher-panel",
          "/users",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
