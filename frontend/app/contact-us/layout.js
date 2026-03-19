import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicContactData } from "@/src/shared/seo/api";
import {
  buildBreadcrumbSchema,
  buildContactPageSchema,
} from "@/src/shared/seo/structuredData";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export async function generateMetadata() {
  const contact = await getPublicContactData();

  return buildSeoMetadata({
    title: "Contact Us",
    description:
      contact?.email || contact?.phone
        ? `Reach the support team for admissions, course guidance, payments, and platform help.${contact?.email ? ` Email: ${contact.email}.` : ""}`
        : "Reach the support team for admissions, course guidance, payments, and platform help.",
    path: "/contact-us",
    keywords: ["contact HSC Academic", "admission support", "student support Bangladesh"],
  });
}

export default async function ContactUsLayout({ children }) {
  const contact = await getPublicContactData();
  const schema = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact Us", path: "/contact-us" },
    ]),
    buildContactPageSchema({ contact }),
  ];

  return (
    <WithNavbarLayout>
      <JsonLd id="contact-schema" data={schema} />
      {children}
    </WithNavbarLayout>
  );
}
