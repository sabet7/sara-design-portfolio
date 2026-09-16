import { getAllCaseStudies, getAllExplorations } from "@/lib/content";
import HomeGrid, { CardData } from "@/components/HomeGrid";
import FrostedReveal from "@/components/frosted-reveal/FrostedReveal";

export default function Home() {
  const caseStudies = getAllCaseStudies();
  const explorations = getAllExplorations();

  const items: CardData[] = [
    ...caseStudies.map((cs) => ({
      slug: cs.frontmatter.slug,
      title: cs.frontmatter.projectTitle,
      year: cs.frontmatter.year,
      types: cs.frontmatter.designType,
      thumbnailSrc: cs.frontmatter.thumbnailImage,
      gifSrc: cs.frontmatter.gifImage,
      variant: "case-study" as const,
      featured: cs.frontmatter.featured,
      timeline: (cs.frontmatter as { timeline?: string }).timeline,
      href: `/case-studies/${cs.frontmatter.slug}`,
    })),
    ...explorations.map((ex) => ({
      slug: ex.frontmatter.slug,
      title: ex.frontmatter.name,
      year: ex.frontmatter.explorationYear,
      types: [ex.frontmatter.category],
      thumbnailSrc: ex.frontmatter.mainImage,
      variant: "exploration" as const,
      href: `/explorations/${ex.frontmatter.slug}`,
    })),
  ];

  return (
    <main style={{ padding: "0 3rem 3rem" }}>
      <div style={{ marginBottom: "4rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "3rem" }}>
          <p className="home-intro">
            Welcome to the digital archive of Sara Del Villar, a multidisciplinary
            product designer and developer working across web, brand, and product design to build unique and delighful experiences that connect businesses with their users.
          </p>
          <div style={{ width: 220, flexShrink: 0 }}>
            <FrostedReveal
              src="/media/personal/portrait-placeholder.png"
              alt="Sara Del Villar"
              width={220}
              height={220}
              resetOnLeave={false}
            />
          </div>
        </div>
      </div>
      <HomeGrid items={items} />
    </main>
  );
}
