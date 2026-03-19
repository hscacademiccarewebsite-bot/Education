import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicCoursesData, getPublicSiteSettingsData } from "@/src/shared/seo/api";
import {
  buildBreadcrumbSchema,
  buildCourseListSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export async function generateMetadata() {
  const siteSettings = await getPublicSiteSettingsData();
  const general = siteSettings?.general || {};

  return buildSeoMetadata({
    title: "Courses",
    description:
      general.siteTagline ||
      "Explore active and upcoming courses designed for HSC and admission preparation with structured academic support.",
    path: "/courses",
    keywords: ["courses", "HSC courses", "admission courses", "online batch learning"],
  });
}

export default async function SegmentLayout({ children }) {
  const courses = await getPublicCoursesData();
  const schema = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Courses", path: "/courses" },
    ]),
    buildCourseListSchema(courses),
  ];

  return (
    <WithNavbarLayout>
      <JsonLd id="courses-schema" data={schema} />
      {children}
    </WithNavbarLayout>
  );
}
