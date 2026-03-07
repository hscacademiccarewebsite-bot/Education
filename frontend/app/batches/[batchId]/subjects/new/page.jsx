import { redirect } from "next/navigation";

export default async function NewSubjectPage({ params }) {
  const resolvedParams = await params;
  redirect(`/batches/${resolvedParams.batchId}`);
}
