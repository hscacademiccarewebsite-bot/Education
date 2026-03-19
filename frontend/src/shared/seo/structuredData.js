import { absoluteUrl, SITE_NAME } from "@/src/shared/seo/site";

export function buildOrganizationSchema({ general = {}, contact = {} } = {}) {
  const sameAs = [contact.facebookPage].filter(Boolean);
  const contactPoints = [contact.phone, contact.email].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description:
      general.siteTagline ||
      "Focused academic care for HSC and admission preparation with structured courses and transparent operations.",
    logo: general.logoUrl || absoluteUrl("/logo.png"),
    image: general.logoUrl || absoluteUrl("/logo.png"),
    address: contact.address
      ? {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressCountry: "BD",
        }
      : undefined,
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    contactPoint: contactPoints.length
      ? [
          {
            "@type": "ContactPoint",
            telephone: contact.phone || undefined,
            email: contact.email || undefined,
            contactType: "customer support",
            availableLanguage: ["English", "Bengali"],
          },
        ]
      : undefined,
  };
}

export function buildWebsiteSchema({ description } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description,
    inLanguage: ["en", "bn"],
    publisher: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
  };
}

export function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildCourseListSchema(courses = []) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Course Catalog",
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/courses/${course._id}`),
      name: course.name,
    })),
  };
}

export function buildCourseSchema(course = {}) {
  const offers =
    Number.isFinite(Number(course.monthlyFee)) && Number(course.monthlyFee) >= 0
      ? {
          "@type": "Offer",
          price: Number(course.monthlyFee),
          priceCurrency: course.currency || "BDT",
          availability:
            course.status === "archived"
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/InStock",
          url: absoluteUrl(`/courses/${course._id}`),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description:
      course.description ||
      "Structured academic progression with guided subjects, chapters, and learner support.",
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    image: course.banner?.url || course.thumbnail?.url || absoluteUrl("/opengraph-image"),
    courseCode: course.slug || course._id,
    offers,
    hasCourseInstance: {
      "@type": "CourseInstance",
      name: course.name,
      courseMode: "Online and offline support",
      startDate: course.startsAt || undefined,
      endDate: course.endsAt || undefined,
    },
  };
}

export function buildContactPageSchema({ contact = {} } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Us",
    url: absoluteUrl("/contact-us"),
    description:
      "Get in touch for admissions, course guidance, enrollment support, and payment help.",
    mainEntity: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      email: contact.email || undefined,
      telephone: contact.phone || undefined,
      address: contact.address || undefined,
    },
  };
}

export function buildAboutPageSchema({ about = {} } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Us",
    url: absoluteUrl("/about-us"),
    description:
      about.description ||
      "Learn how HSC Academic and Admission Care structures courses, content progression, and learner support.",
    mainEntity: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      description: about.description || about.heading || undefined,
      slogan: about.mission || undefined,
    },
  };
}

export function buildFacultyCollectionSchema(faculty = []) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Faculty and Support Team",
    url: absoluteUrl("/faculty"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: faculty.map((member, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: member.fullName,
      })),
    },
  };
}
