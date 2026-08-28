import { notFound } from "next/navigation";
import { getExplorationBySlug } from "@/lib/content";
import ExplorationDetail from "@/components/ExplorationDetail";
import ModalBackdrop from "@/components/ModalBackdrop";

export default async function ExplorationModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exploration = getExplorationBySlug(slug);
  if (!exploration) notFound();

  return (
    <ModalBackdrop>
      <ExplorationDetail exploration={exploration} />
    </ModalBackdrop>
  );
}
