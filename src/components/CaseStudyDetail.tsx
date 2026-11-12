import type { ReactNode } from "react";
import { ViewTransition } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
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

// The sidebar lists every "###### Heading" found in this case study's own
// MDX, in the order they appear. So a case study with "###### Process" shows
// Process, one with "###### Engineering and Design" shows that instead, with
// no code change.
function getSectionHeadings(content: string): { label: string; id: string }[] {
  const labels = Array.from(content.matchAll(/^######\s+(.+?)\s*$/gm), (m) => m[1]);
  return labels.map((label) => ({ label, id: slugify(label) }));
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
// Images in the MDX body. Write ![alt text](/media/...) for a plain image, or
// add a caption in quotes after the path for ONLY the images that should have
// one: ![alt text](/media/... "Caption shown under the image"). The alt text
// is never shown; it stays hidden for screen readers.
function MdxImage({ title, alt, ...rest }: React.ComponentProps<"img">) {
  // eslint-disable-next-line @next/next/no-img-element
  const image = <img alt={alt ?? ""} {...rest} />;
  if (!title) return image;
  return (
    <span className="media-figure">
      {image}
      <span className="media-caption">{title}</span>
    </span>
  );
}

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
  img: MdxImage,
  VoiceNote,
  DuolingoCharacter,
};

// "Coming soon" layout, used when a project's frontmatter has
// `comingSoon: true`. Shows the client name, design type, one-liner,
// role / year / skills and `comingSoonSummary`, with a placeholder block on
// the right for work to come. The MDX body is not shown. Styles are the
// .coming-soon-* rules in globals.css.
function ComingSoon({ frontmatter }: { frontmatter: CaseStudy["frontmatter"] }) {
  const meta = [
    frontmatter.role.length > 0 ? frontmatter.role.join(", ") : null,
    frontmatter.year,
    frontmatter.skills.length > 0 ? frontmatter.skills.join(", ") : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="coming-soon">
      <div className="coming-soon-main">
        <p className="coming-soon-label">Coming soon</p>
        <div className="coming-soon-info">
          <div className="coming-soon-head">
            <h1 className="coming-soon-name">{frontmatter.client}</h1>
            <div className="coming-soon-tags">
              {frontmatter.designType.map((type) => (
                <span key={type} className="coming-soon-tag">
                  {type}
                </span>
              ))}
            </div>
          </div>
          <p className="coming-soon-oneliner">{frontmatter.oneLiner}</p>
          <div className="coming-soon-meta">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          {frontmatter.comingSoonSummary && (
            <p className="detail-paragraph">{frontmatter.comingSoonSummary}</p>
          )}
        </div>
      </div>
      <div className="coming-soon-art" aria-hidden={frontmatter.gifImage ? undefined : true}>
        {frontmatter.gifImage && (
          // Plain <img>: next/image would turn the GIF into a still image.
          <img src={frontmatter.gifImage} alt="" />
        )}
      </div>
    </div>
  );
}

export default function CaseStudyDetail({ caseStudy }: { caseStudy: CaseStudy }) {
  const { frontmatter, content } = caseStudy;

  // `comingSoon: true` takes priority over the password gate and the full
  // case study: the project shows only the short "Coming soon" page.
  if (frontmatter.comingSoon) return <ComingSoon frontmatter={frontmatter} />;

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
          sections={getSectionHeadings(content)}
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
  // needs (password, hint text, your hand-drawn frame image, the keyhole
  // animation) comes straight from this project's own frontmatter, so no
  // code change is needed to gate a different project later — just set
  // `private: true` and `password: "..."` on it.
  //
  // `frontmatter.password ?? ""` is just a type-safety fallback for
  // TypeScript (PasswordGate's `password` prop is a required string) — in
  // practice every project with `private: true` should have its own
  // `password` set in its .mdx frontmatter, or it will render locked with
  // no working password.
  if (frontmatter.private) {
    return (
      <PasswordGate
        slug={frontmatter.slug}
        password={frontmatter.password ?? ""}
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
