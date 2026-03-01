import { redirect } from "next/navigation";

export default async function CourseDetailsAliasPage({ params }) {
  const resolvedParams = await params;
  redirect(`/batches/${resolvedParams.courseId}`);
}
