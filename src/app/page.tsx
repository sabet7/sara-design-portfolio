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
      featured: cs.frontmatter.featured,
      timeline: cs.frontmatter.timeline,
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
      {/* Portrait removed — it now lives in Elie's "About" modal instead of
          next to this paragraph (see Elie.tsx's ProfileCircle, which reads
          from /media/elie/sara-profile.webp). This is a single-column block
          now, no more flex row / FrostedReveal here. */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="home-intro-heading">
          Product designer — designing for connection and fun!
        </h1>
        <p className="home-intro">
          Welcome to my digital archive, a place for projects and explorations. I design products and then build them, working across web and prodcut to connect people and and meet business goals.

          Some of what's archived here is shipped and in use (like a tailor shop's work-order system) or in beta. The rest are the result of curiosity and exploration. Browse at your own pace! The weather's fine.
        </p>
      </div>
      <HomeGrid items={items} />
    </main>
  );
}
