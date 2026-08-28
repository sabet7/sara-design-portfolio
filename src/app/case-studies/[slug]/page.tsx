import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/content";
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

  return (
    <div className="detail-overlay">
      <div className="detail-card">
        <Link href="/" className="detail-close" aria-label="Close">
          ×
        </Link>
        <CaseStudyDetail caseStudy={caseStudy} />
      </div>
    </div>
  );
}
