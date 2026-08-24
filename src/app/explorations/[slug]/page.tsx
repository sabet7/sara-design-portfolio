import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllExplorations, getExplorationBySlug } from "@/lib/content";

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

  return (
    <main style={{ padding: "3rem", fontFamily: "sans-serif" }}>
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
