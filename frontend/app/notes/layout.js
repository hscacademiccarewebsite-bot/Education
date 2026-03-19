import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Notes",
  path: "/notes",
});

export default function NotesLayout({ children }) {
  return children;
}
