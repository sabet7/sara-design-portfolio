// Destination: app/@modal/(.)case-studies/[slug]/page.tsx
//
// The "(.)" matches case-studies at the SAME folder level as this @modal
// folder — i.e. directly under app/, which is where you said your
// case-studies/[slug]/page.tsx already lives. This file is what actually
// makes it a modal: Next.js only renders it when the navigation to
// /case-studies/[slug] happened via client-side navigation FROM somewhere
// else in the app (e.g. clicking a card on the home grid) — a hard
// refresh or a direct link still falls through to your existing
// app/case-studies/[slug]/page.tsx, full page, untouched.
//
// No generateStaticParams/generateMetadata here on purpose — this route
// never serves as the canonical page search engines or link previews see
// (your existing full-page route still owns that), it only ever renders
// as an overlay during an in-app navigation.
import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/content";
import CaseStudyDetail from "@/components/CaseStudyDetail";
import Modal from "@/components/Modal";

export default async function InterceptedCaseStudyModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  return (
    <Modal>
      <CaseStudyDetail caseStudy={caseStudy} />
    </Modal>
  );
}
