import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Notifications",
  path: "/notifications",
});

export default function NotificationsLayout({ children }) {
  return children;
}
