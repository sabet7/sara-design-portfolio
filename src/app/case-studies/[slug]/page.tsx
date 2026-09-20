import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import CaseStudyDetail from "@/components/CaseStudyDetail";

export function generateStaticParams() {
  return getAllCaseStudies().map((cs) => ({ slug: cs.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) return {};

  const { frontmatter } = caseStudy;

  // Private case studies sit behind PasswordGate's blur — but metadata
  // doesn't know that. Search engines index whatever's in generateMetadata
  // regardless of what renders on screen, and link previews (iMessage,
  // Slack, Twitter) read it directly too. So a private project gets a
  // generic, non-revealing title/description here instead of its real
  // one-liner and hero image, plus `robots: noindex` so it never surfaces
  // in search results at all. This is what actually keeps a gated case
  // study gated — the password prompt alone doesn't stop content from
  // leaking through the page's own <head>.
  if (frontmatter.private) {
    return {
      title: frontmatter.projectTitle,
      description: "This case study is password protected.",
      alternates: { canonical: `/case-studies/${frontmatter.slug}` },
      robots: { index: false, follow: false },
      openGraph: {
        title: frontmatter.projectTitle,
        description: "This case study is password protected.",
      },
      twitter: {
        title: frontmatter.projectTitle,
        description: "This case study is password protected.",
      },
    };
  }

  return {
    title: frontmatter.projectTitle,
    description: frontmatter.oneLiner,
    alternates: { canonical: `/case-studies/${frontmatter.slug}` },
    openGraph: {
      title: frontmatter.projectTitle,
      description: frontmatter.oneLiner,
      images: [{ url: frontmatter.heroImage }],
    },
    twitter: {
      title: frontmatter.projectTitle,
      description: frontmatter.oneLiner,
      images: [frontmatter.heroImage],
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  const { frontmatter } = caseStudy;

  // Structured data (JSON-LD): tells Google what this page actually is —
  // a portfolio case study with a named author — which is what can earn a
  // richer search result (your name, an image) instead of a plain blue
  // link. Skipped entirely for private projects: there's nothing to
  // describe publicly, and handing crawlers the same details in a
  // different format would undo the noindex above.
  const jsonLd = frontmatter.private
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: frontmatter.projectTitle,
        description: frontmatter.oneLiner,
        image: frontmatter.heroImage,
        url: `${SITE_URL}/case-studies/${frontmatter.slug}`,
        author: {
          "@type": "Person",
          name: SITE_NAME,
          url: SITE_URL,
        },
      };

  return (
    <div className="detail-overlay">
      <div className="detail-card">
        <Link href="/" className="detail-close" aria-label="Close">
          ×
        </Link>
        {jsonLd && (
          // eslint-disable-next-line react/no-danger
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <CaseStudyDetail caseStudy={caseStudy} />
      </div>
    </div>
  );
}

