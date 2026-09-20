import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllExplorations, getExplorationBySlug } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/site";

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
    <main style={{ padding: "3rem", fontFamily: "sans-serif" }}>
      {jsonLd && (
        // eslint-disable-next-line react/no-danger
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <p style={{ opacity: 0.6 }}>
        {frontmatter.explorationYear} · {frontmatter.category}
      </p>
      <h1>{frontmatter.name}</h1>
      <p>{frontmatter.oneLiner}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frontmatter.mainImage}
        alt={frontmatter.name}
        style={{ maxWidth: "100%" }}
      />
      <article>
        <MDXRemote source={content} />
      </article>
    </main>
  );
}
