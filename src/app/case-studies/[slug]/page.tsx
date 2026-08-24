import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/content";

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

  const { frontmatter, content } = caseStudy;

  return (
    <main style={{ padding: "3rem", fontFamily: "sans-serif" }}>
      <p style={{ opacity: 0.6 }}>
        {frontmatter.year} · {frontmatter.status}
      </p>
      <h1>{frontmatter.projectTitle}</h1>
      <p>{frontmatter.oneLiner}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frontmatter.heroImage}
        alt={frontmatter.projectTitle}
        style={{ maxWidth: "100%" }}
      />
      <article>
        <MDXRemote source={content} />
      </article>
    </main>
  );
}
