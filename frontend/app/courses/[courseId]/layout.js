import JsonLd from "@/components/seo/JsonLd";
import { getPublicCourseById } from "@/src/shared/seo/api";
import {
  buildBreadcrumbSchema,
  buildCourseSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata } from "@/src/shared/seo/site";

function buildCourseDescription(course) {
  if (course?.description) {
    return course.description;
  }

  if (Number.isFinite(Number(course?.monthlyFee))) {
    return `${course.name} is an academic course with structured progression and a monthly fee of ${Number(course.monthlyFee)} ${course.currency || "BDT"}.`;
  }

  return `${course?.name || "Course"} offers structured academic progression with guided support and organized learning materials.`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const courseId = resolvedParams?.courseId;
  const course = await getPublicCourseById(courseId);

  if (!course) {
    return buildSeoMetadata({
      title: "Course Details",
      description: "Browse course details, structure, and academic support information.",
      path: `/courses/${courseId}`,
    });
  }

  return buildSeoMetadata({
    title: course.name,
    description: buildCourseDescription(course),
    path: `/courses/${courseId}`,
    keywords: [course.name, course.slug, course.status].filter(Boolean),
    images: [
      {
        url: course.banner?.url || course.thumbnail?.url || "/opengraph-image",
        alt: course.name,
      },
    ],
    noIndex: course.status === "archived",
  });
}

export default async function CourseDetailsLayout({ children, params }) {
  const resolvedParams = await params;
  const courseId = resolvedParams?.courseId;
  const course = await getPublicCourseById(courseId);
  const schema = course
    ? [
        buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Courses", path: "/courses" },
          { name: course.name, path: `/courses/${courseId}` },
        ]),
        buildCourseSchema(course),
      ]
    : null;

  return (
    <>
      <JsonLd id="course-schema" data={schema} />
      {children}
    </>
  );
}
