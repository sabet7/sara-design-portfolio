"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import LiquidNav, { Filter } from "./LiquidNav";

export interface CardData {
  slug: string;
  title: string;
  year: string;
  types: string[];
  thumbnailSrc: string;
  gifSrc?: string;
  variant: "case-study" | "exploration";
  featured?: boolean;
  timeline?: string;
  href: string;
}

// "Works" = case studies, "Fun" = design explorations — matches on the
// card's variant directly rather than its types, since the nav no longer
// filters by project type (Product/Web/Brand now live on the card
// itself instead — see ProjectCard).
function matchesFilter(item: CardData, filter: Filter): boolean {
  return filter === "Works" ? item.variant === "case-study" : item.variant === "exploration";
}

export default function HomeGrid({ items }: { items: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("Works");
  const visible = items.filter((item) => matchesFilter(item, filter));

  return (
    <>
      <div
        style={{
          display: "grid",
          // Was repeat(5, 1fr) — dropped to 4 columns per row so each
          // card (and its thumbnail image) renders larger. Same 4:3 image
          // aspect ratio as before (see .project-card-media in
          // globals.css) — this only changes how many fit per row, not
          // the image's proportions.
          gridTemplateColumns: "repeat(4, 1fr)",
          rowGap: "3rem",
          columnGap: "1.5rem",
          paddingBottom: "6rem",
        }}
      >
        {visible.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <ProjectCard
              slug={item.slug}
              title={item.title}
              year={item.year}
              types={item.types}
              thumbnailSrc={item.thumbnailSrc}
              gifSrc={item.gifSrc}
              variant={item.variant}
              featured={item.featured}
              timeline={item.timeline}
            />
          </Link>
        ))}
      </div>
      <LiquidNav active={filter} onChange={setFilter} />
    </>
  );
}
