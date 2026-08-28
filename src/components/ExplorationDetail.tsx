import { MDXRemote } from "next-mdx-remote/rsc";
import type { Exploration } from "@/lib/content";

const mdxComponents = {
  p: (props: React.ComponentProps<"p">) => <p className="detail-paragraph" {...props} />,
};

export default function ExplorationDetail({ exploration }: { exploration: Exploration }) {
  const { frontmatter, content } = exploration;
  const hasPainPoints = frontmatter.painPoints.some((p) => p.trim());
  const hasSolutions = frontmatter.solutions.some((s) => s.trim());

  return (
    <>
      <div className="detail-header">
        <div>
          <h1 className="detail-title">{frontmatter.name}</h1>
          <p className="detail-subtitle">{frontmatter.oneLiner}</p>
        </div>
        <span className="detail-tag" style={{ background: "rgb(99 198 255)" }}>
          {frontmatter.category}
        </span>
      </div>

      <div className="detail-meta-row">
        {frontmatter.role.length > 0 && <span>Role: {frontmatter.role.join(", ")}</span>}
        <span>Year: {frontmatter.explorationYear}</span>
        {frontmatter.skills.length > 0 && <span>Skills: {frontmatter.skills.join(", ")}</span>}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frontmatter.mainImage} alt={frontmatter.name} className="detail-hero" />

      <article className="detail-content">
        <MDXRemote source={content} components={mdxComponents} />
      </article>

      {hasPainPoints && (
        <div className="detail-list-section">
          <h3>Key pain points</h3>
          <ul>
            {frontmatter.painPoints
              .filter((p) => p.trim())
              .map((p) => (
                <li key={p}>{p}</li>
              ))}
          </ul>
        </div>
      )}

      {hasSolutions && (
        <div className="detail-list-section">
          <h3>Solutions</h3>
          <ul>
            {frontmatter.solutions
              .filter((s) => s.trim())
              .map((s) => (
                <li key={s}>{s}</li>
              ))}
          </ul>
        </div>
      )}

      {frontmatter.images.length > 0 && (
        <div className="exploration-gallery">
          {frontmatter.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img} src={img} alt="" />
          ))}
        </div>
      )}
    </>
  );
}
