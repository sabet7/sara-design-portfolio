// Destination: app/@modal/(.)explorations/[slug]/page.tsx
//
// Same intercepting pattern as the case-study one — see that file's
// comment for how "(.)" and the no-metadata choice work. Your current
// full-page exploration route (app/explorations/[slug]/page.tsx) renders
// pretty bare (inline fontFamily: sans-serif, no .detail-* classes) —
// that page is untouched and still handles direct links/refreshes. This
// modal version uses the same .detail-title/.detail-paragraph classes as
// the case-study modal instead of copying that bare styling, so the two
// content types look consistent when opened as an overlay. Say if you'd
// rather it matched the plain full-page look instead.
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getExplorationBySlug } from "@/lib/content";
import Modal from "@/components/Modal";

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
      <div className="detail-header">
        <div>
          <h1 className="detail-title">{frontmatter.name}</h1>
          <p className="detail-subtitle">{frontmatter.oneLiner}</p>
        </div>
        <div className="detail-meta">
          <span>{frontmatter.explorationYear}</span>
          <span>{frontmatter.category}</span>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frontmatter.mainImage}
        alt={frontmatter.name}
        className="detail-hero"
      />
      <article className="detail-content">
        <div className="detail-paragraph">
          <MDXRemote source={content} />
        </div>
      </article>
    </Modal>
  );
}
