import { buildNoIndexMetadata } from "@/src/shared/seo/site";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const batchId = resolvedParams?.batchId;

  return buildNoIndexMetadata({
    title: "Legacy Course Route",
    description: "Legacy route alias for course detail pages.",
    path: `/batches/${batchId}`,
    canonicalPath: `/courses/${batchId}`,
  });
}

export default function BatchAliasLayout({ children }) {
  return children;
}
