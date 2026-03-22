import {
  absoluteUrl,
  buildLocalSeoDescription,
  LOCAL_POSITIONING,
  PRIMARY_CITY,
  PRIMARY_REGION,
  SITE_NAME,
} from "@/src/shared/seo/site";

function buildAddress(contact = {}) {
  return {
    "@type": "PostalAddress",
    streetAddress: contact.address || PRIMARY_CITY,
    addressLocality: PRIMARY_CITY,
    addressRegion: "Chattogram",
    addressCountry: "BD",
  };
}

function buildAreaServed() {
  return [
    {
      "@type": "City",
      name: PRIMARY_CITY,
    },
    {
      "@type": "AdministrativeArea",
      name: PRIMARY_REGION,
    },
  ];
}

export function buildOrganizationSchema({ general = {}, contact = {} } = {}) {
  const sameAs = [contact.facebookPage].filter(Boolean);
  const contactPoints = [contact.phone, contact.email].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: buildLocalSeoDescription(
      general.siteTagline ||
      "Focused academic care for HSC and admission preparation with structured courses and transparent operations."
    ),
    slogan: LOCAL_POSITIONING,
    logo: general.logoUrl || absoluteUrl("/icon.png"),
    image: general.logoUrl || absoluteUrl("/logo.png"),
    address: buildAddress(contact),
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    areaServed: buildAreaServed(),
    hasMap: contact.mapEmbedUrl || undefined,
    knowsAbout: [
      "HSC Science coaching",
      "HSC board preparation",
      "admission preparation",
      "academic mentoring",
    ],
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
    description: buildLocalSeoDescription(description),
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
    name: `Best HSC courses in ${PRIMARY_CITY}`,
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
    description: buildLocalSeoDescription(
      course.description ||
      `Structured academic progression with guided subjects, chapters, and learner support in ${PRIMARY_CITY}.`
    ),
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
    description: buildLocalSeoDescription(
      `Get in touch with the ${PRIMARY_CITY} coaching center for admissions, course guidance, enrollment support, and payment help.`
    ),
    mainEntity: {
      "@type": ["EducationalOrganization", "LocalBusiness"],
      name: SITE_NAME,
      email: contact.email || undefined,
      telephone: contact.phone || undefined,
      address: buildAddress(contact),
      areaServed: buildAreaServed(),
    },
  };
}



export function buildFacultyCollectionSchema(faculty = []) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Faculty of the best HSC coaching center in ${PRIMARY_CITY}`,
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
