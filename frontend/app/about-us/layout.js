import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicAboutData } from "@/src/shared/seo/api";
import {
  buildAboutPageSchema,
  buildBreadcrumbSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export async function generateMetadata() {
  const about = await getPublicAboutData();

  return buildSeoMetadata({
    title: "About Us",
    description:
      about?.description ||
      "Learn how HSC Academic and Admission Care structures courses, content delivery, and student support.",
    path: "/about-us",
    keywords: ["about HSC Academic", "academic care platform", "education mission"],
  });
}

export default async function AboutUsLayout({ children }) {
  const about = await getPublicAboutData();
  const schema = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about-us" },
    ]),
    buildAboutPageSchema({ about }),
  ];

  return (
    <WithNavbarLayout>
      <JsonLd id="about-schema" data={schema} />
      {children}
    </WithNavbarLayout>
  );
}
