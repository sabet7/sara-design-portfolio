import type { ComponentProps } from "react";
import { ViewTransition } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ExplorationFrontmatter } from "@/content/types";

// Shared by the modal route (app/@modal/(.)explorations/[slug]/page.tsx) and
// the full-page route (app/explorations/[slug]/page.tsx), so both look the
// same. Layout: text on the left (title, one-liner, role/year/skills, the
// MDX body, then pain points / solutions / learnings), image mosaic on the
// right. Styles are the .exploration-* rules in globals.css.

function heading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading(props: ComponentProps<"h2">) {
    return <Tag className="exploration-heading" {...props} />;
  };
}

const mdxComponents = {
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
  p: (props: ComponentProps<"p">) => <p className="exploration-text" {...props} />,
};

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="exploration-list">
      <h2 className="exploration-heading">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function ExplorationDetail({
  frontmatter,
  content,
}: {
  frontmatter: ExplorationFrontmatter;
  content: string;
}) {
  // Main image first, then the rest of `images` (without repeating it).
  const gallery = [
    frontmatter.mainImage,
    ...frontmatter.images.filter((src) => src !== frontmatter.mainImage),
  ].filter(Boolean);

  const meta = [
    frontmatter.role.length > 0 ? frontmatter.role.join(", ") : null,
    frontmatter.explorationYear,
    frontmatter.skills.length > 0 ? frontmatter.skills.join(", ") : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="exploration-detail">
      <div className="exploration-info">
        <div className="exploration-top">
          <h1 className="exploration-title">{frontmatter.name}</h1>
          <span className="exploration-type">{frontmatter.category}</span>
        </div>
        <p className="exploration-oneliner">{frontmatter.oneLiner}</p>

        <div className="exploration-meta">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        <div className="exploration-body">
          <MDXRemote source={content} components={mdxComponents} />
        </div>

        <BulletSection
          title="Key pain points, obstacles or problems:"
          items={frontmatter.painPoints}
        />
        <BulletSection title="Solutions" items={frontmatter.solutions} />
        <BulletSection title="Learnings" items={frontmatter.learnings} />
      </div>

      <div className="exploration-mosaic" data-count={Math.min(gallery.length, 8)}>
        {gallery.map((src, i) =>
          i === 0 ? (
            <ViewTransition key={src} name={`project-media-${frontmatter.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={frontmatter.name} />
            </ViewTransition>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={`${frontmatter.name}, image ${i + 1}`} loading="lazy" />
          )
        )}
      </div>
    </div>
  );
}
