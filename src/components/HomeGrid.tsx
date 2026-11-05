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

// Columns are chosen from how many cards are showing (Works and Fun are
// counted separately) so the grid fills the page edge to edge, lined up with
// the heading and paragraph above it, with the last row as full as possible:
// 4 cards -> 4 across, 5 -> 3+2, 6 -> 3x2, 7 -> 4+3, 8 -> 4x2, 9 -> 3x3.
// A last row that isn't full lines up with the columns above it. Fewer columns means bigger cards
// and more space between them (see gapFor). Screens narrower than 1100px use
// at most 3 columns, and narrower than 760px at most 2, by the same rule.
const DESKTOP_MAX_COLUMNS = 4;
const TABLET_MAX_COLUMNS = 3;
const MOBILE_MAX_COLUMNS = 2;
const MOBILE_GAP_PX = 16;

function pickColumns(count: number, minColumns: number, maxColumns: number): number {
  // One or two cards: sized like a 3-column grid (2 on phones).
  if (count <= 2) return Math.min(3, maxColumns);
  let best = minColumns;
  let bestScore = Infinity;
  for (let cols = minColumns; cols <= Math.min(maxColumns, count); cols++) {
    const rows = Math.ceil(count / cols);
    const empty = rows * cols - count; // empty cells in the last row
    const lastRow = cols - empty; // cards in the last row
    // Near-full, near-square, and never a single card left alone on its row.
    const score = empty * 3 + Math.abs(cols - rows) + (lastRow === 1 ? 6 : 0);
    if (score < bestScore) {
      best = cols;
      bestScore = score; // a tie keeps the smaller column count (bigger cards)
    }
  }
  return best;
}

// Space between cards: a little more when there are fewer, bigger cards.
function gapFor(cols: number): string {
  if (cols >= 4) return "24px";
  if (cols === 3) return "40px";
  return "56px";
}

// Grid rules live HERE, not in globals.css, so the layout can never depend
// on whether globals.css was swapped/reloaded. The column counts and gaps
// arrive as CSS variables set on the grid element below.
const GRID_CSS = `
.sdv-home-grid {
  --cols: var(--cols-d);
  --gap: var(--gap-d);
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  column-gap: var(--gap);
  row-gap: 3rem;
  padding-bottom: 6rem;
}
.sdv-home-card {
  flex: 0 0 calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols) - 0.5px);
  min-width: 0;
  text-decoration: none;
  color: inherit;
}
@media (max-width: 1100px) {
  .sdv-home-grid {
    --cols: var(--cols-t);
    --gap: var(--gap-t);
  }
}
@media (max-width: 760px) {
  .sdv-home-grid {
    --cols: var(--cols-m);
    --gap: ${MOBILE_GAP_PX}px;
    row-gap: 2rem;
  }
}
`;

export default function HomeGrid({ items }: { items: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("Works");
  const visible = items.filter((item) => matchesFilter(item, filter));

  const colsDesktop = pickColumns(visible.length, 3, DESKTOP_MAX_COLUMNS);
  const colsTablet = pickColumns(visible.length, 2, TABLET_MAX_COLUMNS);
  const colsMobile = pickColumns(visible.length, 2, MOBILE_MAX_COLUMNS);
  const gridVars = {
    "--cols-d": colsDesktop,
    "--cols-t": colsTablet,
    "--cols-m": colsMobile,
    "--gap-d": gapFor(colsDesktop),
    "--gap-t": gapFor(colsTablet),
  } as React.CSSProperties;

  return (
    <>
      <style>{GRID_CSS}</style>
      <div className="sdv-home-grid" style={gridVars}>
        {visible.map((item) => (
          <Link key={item.slug} href={item.href} className="sdv-home-card">
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
