import { getApiBaseUrl } from "@/src/shared/seo/site";

async function fetchApiJson(path, { revalidate = 1800 } = {}) {
  const baseUrl = getApiBaseUrl();
  const target = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(target, {
      next: { revalidate },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function getPublicSiteSettingsData() {
  const payload = await fetchApiJson("/public/settings");
  return payload?.data || null;
}

export async function getPublicAboutData() {
  const payload = await fetchApiJson("/public/about");
  return payload?.data || null;
}

export async function getPublicContactData() {
  const payload = await fetchApiJson("/public/contact");
  return payload?.data || null;
}

export async function getPublicFacultyData() {
  const payload = await fetchApiJson("/public/faculty");
  return payload?.data || [];
}

export async function getPublicCoursesData() {
  const payload = await fetchApiJson("/courses");
  return payload?.data || [];
}

export async function getPublicCourseById(courseId) {
  if (!courseId) {
    return null;
  }

  const payload = await fetchApiJson(`/courses/${courseId}`);
  return payload?.data || null;
}
