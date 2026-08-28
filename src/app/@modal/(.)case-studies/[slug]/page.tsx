import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/content";
import CaseStudyDetail from "@/components/CaseStudyDetail";
import ModalBackdrop from "@/components/ModalBackdrop";

export default async function CaseStudyModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  return (
    <ModalBackdrop>
      <CaseStudyDetail caseStudy={caseStudy} />
    </ModalBackdrop>
  );
}
