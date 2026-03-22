import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicCoursesData, getPublicSiteSettingsData } from "@/src/shared/seo/api";
import {
  buildBreadcrumbSchema,
  buildCourseListSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata, PRIMARY_CITY } from "@/src/shared/seo/site";

export async function generateMetadata() {
  const siteSettings = await getPublicSiteSettingsData();
  const general = siteSettings?.general || {};

  return buildSeoMetadata({
    title: `HSC Courses in ${PRIMARY_CITY}`,
    description:
      general.siteTagline ||
      `Explore HSC and admission courses from the best coaching center in ${PRIMARY_CITY}, with structured academic support and Science-focused preparation.`,
    path: "/courses",
    keywords: [
      "courses",
      "HSC courses in Rangamati",
      "admission courses in Rangamati",
      "best coaching center in Rangamati",
      "online batch learning",
    ],
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
