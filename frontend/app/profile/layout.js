import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Profile",
  path: "/profile",
});

export default function ProfileLayout({ children }) {
  return <WithNavbarLayout>{children}</WithNavbarLayout>;
}
