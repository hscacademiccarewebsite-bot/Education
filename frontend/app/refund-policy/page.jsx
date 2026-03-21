import LegalPageTemplate from "@/components/legal/LegalPageTemplate";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export const metadata = buildSeoMetadata({
  title: "Refund Policy",
  description:
    "Understand when refund requests may be considered, which cases are non-refundable, and how approved refunds are processed.",
  path: "/refund-policy",
  keywords: ["refund policy", "course refund", "billing policy", "payment review"],
});

export default function RefundPolicyPage() {
  return <LegalPageTemplate pageKey="refundPolicy" />;
}
