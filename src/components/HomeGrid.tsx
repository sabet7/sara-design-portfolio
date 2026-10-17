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

// Grid rules live HERE, not in globals.css, so the layout can never depend
// on whether globals.css was swapped/reloaded. Always a multi-column grid:
// 4 columns on desktop, 3 on tablet, 2 on mobile — there is deliberately no
// 1-column rule. minmax(0, 1fr) lets columns shrink instead of overflowing.
const GRID_CSS = `
.sdv-home-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 1.5rem;
  row-gap: 3rem;
  padding-bottom: 6rem;
}
@media (max-width: 1100px) {
  .sdv-home-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .sdv-home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 1rem;
    row-gap: 2rem;
  }
}
`;

export default function HomeGrid({ items }: { items: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("Works");
  const visible = items.filter((item) => matchesFilter(item, filter));

  return (
    <>
      <style>{GRID_CSS}</style>
      <div className="sdv-home-grid">
        {visible.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}
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
