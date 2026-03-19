import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Payments",
  path: "/payments",
});

export default function SegmentLayout({ children }) {
  return <WithNavbarLayout>{children}</WithNavbarLayout>;
}
