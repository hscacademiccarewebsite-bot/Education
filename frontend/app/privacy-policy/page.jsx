import LegalPageTemplate from "@/components/legal/LegalPageTemplate";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export const metadata = buildSeoMetadata({
  title: "Privacy Policy",
  description:
    "Learn how HSC Academic & Admission Care collects, uses, protects, and manages student and guardian information.",
  path: "/privacy-policy",
  keywords: ["privacy policy", "student data", "data protection", "education platform privacy"],
});

export default function PrivacyPolicyPage() {
  return <LegalPageTemplate pageKey="privacyPolicy" />;
}
