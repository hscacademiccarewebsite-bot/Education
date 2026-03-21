import LegalPageTemplate from "@/components/legal/LegalPageTemplate";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export const metadata = buildSeoMetadata({
  title: "Terms of Service",
  description:
    "Review the rules for using the website, student dashboard, payments, learning resources, and support services.",
  path: "/terms-of-service",
  keywords: ["terms of service", "platform rules", "student account terms", "education platform terms"],
});

export default function TermsOfServicePage() {
  return <LegalPageTemplate pageKey="termsOfService" />;
}
