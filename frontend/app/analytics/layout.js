import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Analytics",
  path: "/analytics",
});

export default function AnalyticsLayout({ children }) {
  return children;
}
