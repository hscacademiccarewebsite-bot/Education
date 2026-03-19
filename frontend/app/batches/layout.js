import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Legacy Courses Route",
  description: "Legacy route alias for course listings.",
  path: "/batches",
  canonicalPath: "/courses",
});

export default function SegmentLayout({ children }) {
  return (
    <WithNavbarLayout>
      {children}
    </WithNavbarLayout>
  );
}
