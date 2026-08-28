import type { ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { REQUIRED_CASE_STUDY_SECTIONS } from "@/content/types";
import type { CaseStudy } from "@/lib/content";
import DetailSidebar from "@/components/DetailSidebar";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getText).join("");
  return "";
}

const mdxComponents = {
  h6: (props: React.ComponentProps<"h6">) => {
    const text = getText(props.children);
    return <h6 id={slugify(text)} className="detail-section-heading" {...props} />;
  },
  h2: (props: React.ComponentProps<"h2">) => (<h2 className="detail-subheading" {...props} />),
  
  p: (props: React.ComponentProps<"p">) => <p className="detail-paragraph" {...props} />,
};

export default function CaseStudyDetail({ caseStudy }: { caseStudy: CaseStudy }) {
  const { frontmatter, content } = caseStudy;

  return (
    <>
      <div className="detail-header">
        <div>
          <h1 className="detail-title">{frontmatter.projectTitle}</h1>
          <p className="detail-subtitle">{frontmatter.oneLiner}</p>
          {frontmatter.role.length > 0 && (
            <div className="detail-tags-row">
              {frontmatter.role.map((r) => (
                <span key={r} className="detail-tag">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="detail-meta">
          <span>{frontmatter.year}</span>
          <span>{frontmatter.status}</span>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frontmatter.heroImage} alt={frontmatter.projectTitle} className="detail-hero" />

      <div className="detail-body">
        <DetailSidebar
          sections={REQUIRED_CASE_STUDY_SECTIONS.map((section) => ({
            label: section,
            id: slugify(section),
          }))}
        />
        <article className="detail-content">
          <MDXRemote source={content} components={mdxComponents} />
        </article>
      </div>
    </>
  );
}
