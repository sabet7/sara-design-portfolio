import { getAllCaseStudies, getAllExplorations } from "@/lib/content";
import HomeGrid, { CardData } from "@/components/HomeGrid";

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
      <p className="home-intro">
        Welcome to the digital garden of Sara Del Villar, a multidisciplinary
        product designer and developer; exploring the space between
        storytelling, data, and craft. Working across product design, design
        systems, and code to build and shape experiences for future digital
        products.
      </p>
      <HomeGrid items={items} />
    </main>
  );
}
