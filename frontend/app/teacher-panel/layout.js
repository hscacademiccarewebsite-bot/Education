import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export const metadata = buildNoIndexMetadata({
  title: "Teacher Panel",
  path: "/teacher-panel",
});

export default function TeacherPanelLayout({ children }) {
  return children;
}
