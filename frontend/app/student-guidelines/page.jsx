import LegalPageTemplate from "@/components/legal/LegalPageTemplate";
import { buildSeoMetadata } from "@/src/shared/seo/site";

export const metadata = buildSeoMetadata({
  title: "Student Guidelines",
  description:
    "Read the expectations for discipline, communication, class behavior, payments, and responsible platform use.",
  path: "/student-guidelines",
  keywords: ["student guidelines", "class rules", "community conduct", "academic discipline"],
});

export default function StudentGuidelinesPage() {
  return <LegalPageTemplate pageKey="studentGuidelines" />;
}
