import type { ReactNode } from "react";
import { ViewTransition } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { REQUIRED_CASE_STUDY_SECTIONS } from "@/content/types";
import type { CaseStudy } from "@/lib/content";
import DetailSidebar from "@/components/DetailSidebar";
import VoiceNote from "@/components/voice-note/VoiceNote";
import PasswordGate from "@/components/PasswordGate";
import DuolingoCharacter from "@/components/duolingo-character/DuolingoCharacter";

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

// h1 through h6, largest to smallest. h1 is deliberately styled the same
// as h2 (both use "detail-subheading") rather than getting its own,
// bigger look: the page's own <h1 className="detail-title"> above is
// already the true top-level heading, so any h1 written inside MDX body
// content should read as a section headline, not compete with it for
// "biggest text on the page." h2 and h6 already had classes; h3/h4/h5 are
// new — see the matching .detail-heading-3/4/5 rules in globals.css.
const mdxComponents = {
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 className="detail-subheading" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="detail-subheading" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="detail-heading-3" {...props} />
  ),
  h4: (props: React.ComponentProps<"h4">) => (
    <h4 className="detail-heading-4" {...props} />
  ),
  h5: (props: React.ComponentProps<"h5">) => (
    <h5 className="detail-heading-5" {...props} />
  ),
  h6: (props: React.ComponentProps<"h6">) => {
    const text = getText(props.children);
    return <h6 id={slugify(text)} className="detail-section-heading" {...props} />;
  },

  p: (props: React.ComponentProps<"p">) => <p className="detail-paragraph" {...props} />,
  VoiceNote,
  DuolingoCharacter,
};

export default function CaseStudyDetail({ caseStudy }: { caseStudy: CaseStudy }) {
  const { frontmatter, content } = caseStudy;

  const detail = (
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

      <ViewTransition name={`project-media-${frontmatter.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frontmatter.heroImage} alt={frontmatter.projectTitle} className="detail-hero" />
      </ViewTransition>

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

  // Gated projects (frontmatter.private: true) render the same content as
  // always, but PasswordGate wraps it in a blur + scrim + password prompt
  // until the visitor unlocks it for the session. Everything the prompt
  // needs (hint text, your hand-drawn frame image, the keyhole animation)
  // comes straight from this project's own frontmatter, so no code change
  // is needed to gate a different project later — just set `private: true`
  // on it.
  if (frontmatter.private) {
    return (
      <PasswordGate
        slug={frontmatter.slug}
        hint={frontmatter.passwordHint}
        frameImageSrc={frontmatter.passwordFrameImage}
        animationSrc={frontmatter.passwordAnimation}
      >
        {detail}
      </PasswordGate>
    );
  }

  return detail;
}
