import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllExplorations, getExplorationBySlug } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import ExplorationDetail from "@/components/ExplorationDetail";

export function generateStaticParams() {
  return getAllExplorations().map((ex) => ({ slug: ex.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exploration = getExplorationBySlug(slug);
  if (!exploration) return {};

  const { frontmatter } = exploration;

  // Same reasoning as the case-study route (see the comment there): a
  // private exploration gets a generic description and noindex instead of
  // its real one-liner/image, so nothing about it leaks through search
  // results or link previews.
  if (frontmatter.private) {
    return {
      title: frontmatter.name,
      description: "This exploration is password protected.",
      alternates: { canonical: `/explorations/${frontmatter.slug}` },
      robots: { index: false, follow: false },
      openGraph: {
        title: frontmatter.name,
        description: "This exploration is password protected.",
      },
      twitter: {
        title: frontmatter.name,
        description: "This exploration is password protected.",
      },
    };
  }

  return {
    title: frontmatter.name,
    description: frontmatter.oneLiner,
    alternates: { canonical: `/explorations/${frontmatter.slug}` },
    openGraph: {
      title: frontmatter.name,
      description: frontmatter.oneLiner,
      images: [{ url: frontmatter.mainImage }],
    },
    twitter: {
      title: frontmatter.name,
      description: frontmatter.oneLiner,
      images: [frontmatter.mainImage],
    },
  };
}

export default async function ExplorationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exploration = getExplorationBySlug(slug);
  if (!exploration) notFound();

  const { frontmatter, content } = exploration;

  // NOTE: this only stops the page from leaking through metadata/search.
  // It does NOT hide the content itself — see my message for why that
  // matters here specifically.
  const jsonLd = frontmatter.private
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: frontmatter.name,
        description: frontmatter.oneLiner,
        image: frontmatter.mainImage,
        url: `${SITE_URL}/explorations/${frontmatter.slug}`,
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
        <ExplorationDetail frontmatter={frontmatter} content={content} />
      </div>
    </div>
  );
}
