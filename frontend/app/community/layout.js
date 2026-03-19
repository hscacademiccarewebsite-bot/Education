import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Community",
  path: "/community",
});

export default function CommunityLayout({ children }) {
  return children;
}
