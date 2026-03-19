import { getPublicCoursesData } from "@/src/shared/seo/api";
import { absoluteUrl } from "@/src/shared/seo/site";

export default async function sitemap() {
  const publicRoutes = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/courses"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about-us"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/faculty"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/contact-us"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const courses = await getPublicCoursesData();

  const courseRoutes = courses.map((course) => ({
    url: absoluteUrl(`/courses/${course._id}`),
    lastModified: course.updatedAt || course.createdAt || new Date(),
    changeFrequency: "weekly",
    priority: course.status === "active" ? 0.85 : 0.7,
  }));

  return [...publicRoutes, ...courseRoutes];
}
