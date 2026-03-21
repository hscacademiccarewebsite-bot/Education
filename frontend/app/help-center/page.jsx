import LegalPageTemplate from "@/components/legal/LegalPageTemplate";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export const metadata = buildSeoMetadata({
  title: "Help Center & FAQ",
  description:
    "Find answers about admissions, course access, payments, account issues, and student support.",
  path: "/help-center",
  keywords: ["help center", "student support", "faq", "admission help"],
});

export default function HelpCenterPage() {
  return <LegalPageTemplate pageKey="helpCenter" />;
}
