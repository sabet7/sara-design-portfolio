import type { MetadataRoute } from "next";
import { getAllCaseStudies, getAllExplorations } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const caseStudyEntries = getAllCaseStudies().map((cs) => ({
    url: `${SITE_URL}/case-studies/${cs.frontmatter.slug}`,
    changeFrequency: "monthly" as const,
  }));

  const explorationEntries = getAllExplorations().map((ex) => ({
    url: `${SITE_URL}/explorations/${ex.frontmatter.slug}`,
    changeFrequency: "monthly" as const,
  }));

  return [
    { url: SITE_URL, changeFrequency: "weekly" },
    ...caseStudyEntries,
    ...explorationEntries,
  ];
}
