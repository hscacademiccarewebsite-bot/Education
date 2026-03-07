import { redirect } from "next/navigation";

export default async function NewChapterPage({ params }) {
  const resolvedParams = await params;
  redirect(`/subjects/${resolvedParams.subjectId}`);
}
