import { redirect } from "next/navigation";

export default async function NewVideoPage({ params }) {
  const resolvedParams = await params;
  redirect(`/chapters/${resolvedParams.chapterId}`);
}
