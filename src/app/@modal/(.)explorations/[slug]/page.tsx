// Destination: app/@modal/(.)explorations/[slug]/page.tsx
//
// Same intercepting pattern as the case-study one: this only renders when
// you open an exploration from inside the app (clicking a card). A direct
// link or refresh falls through to app/explorations/[slug]/page.tsx. Both
// now render the same ExplorationDetail component, so they look alike.
import { notFound } from "next/navigation";
import { getExplorationBySlug } from "@/lib/content";
import Modal from "@/components/Modal";
import ExplorationDetail from "@/components/ExplorationDetail";

export default async function InterceptedExplorationModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exploration = getExplorationBySlug(slug);
  if (!exploration) notFound();

  const { frontmatter, content } = exploration;

  return (
    <Modal>
      <ExplorationDetail frontmatter={frontmatter} content={content} />
    </Modal>
  );
}
