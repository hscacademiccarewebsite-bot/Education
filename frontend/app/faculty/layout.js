import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicFacultyData } from "@/src/shared/seo/api";
import {
  buildBreadcrumbSchema,
  buildFacultyCollectionSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export async function generateMetadata() {
  const faculty = await getPublicFacultyData();

  return buildSeoMetadata({
    title: "Faculty",
    description:
      faculty.length > 0
        ? `Meet ${faculty.length} faculty and support team members responsible for course delivery and academic guidance.`
        : "Meet the faculty and support team behind course delivery and student guidance.",
    path: "/faculty",
    keywords: ["faculty", "teachers", "academic mentors", "support team"],
  });
}

export default async function FacultyLayout({ children }) {
  const faculty = await getPublicFacultyData();
  const schema = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Faculty", path: "/faculty" },
    ]),
    buildFacultyCollectionSchema(faculty),
  ];

  return (
    <WithNavbarLayout>
      <JsonLd id="faculty-schema" data={schema} />
      {children}
    </WithNavbarLayout>
  );
}
