"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import LiquidNav, { Filter } from "./LiquidNav";

export interface CardData {
  slug: string;
  title: string;
  subtitle?: string;
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
//
// CARD SPACING. All the gaps on a card are the --card-* variables here:
//   --card-tag-title   tag + year row -> title
//   --card-title-sub   title -> one-liner
//   --card-text-media  one-liner (or title) -> image. The hand-drawn hover
//                      underline hangs about 10px under the text, so keep
//                      this at 12px or more.
//   --card-row-gap     image -> the tag row of the next row of cards
//
// ALIGN_CARD_IMAGES decides what happens when cards in the same row have
// one-liners of different lengths:
//   false  every image sits the same distance under its own text, so the
//          space adapts to the one-liner. The images in a row can then start
//          a line's height apart.
//   true   the images in a row all start at the same height, so the card
//          with the shorter one-liner has extra space under it. (The grid is
//          a CSS "subgrid": each card spans three rows shared across the row.)
const ALIGN_CARD_IMAGES = true;

const CARD_ROWS_CSS = ALIGN_CARD_IMAGES
  ? "grid-row: span 3; grid-template-rows: subgrid;"
  : "align-self: start; grid-template-rows: auto auto auto;";

const GRID_CSS = `
.sdv-home-grid {
  --cols: var(--cols-d);
  --gap: var(--gap-d);
  --card-tag-title: 7px;
  --card-title-sub: 3px;
  --card-text-media: 12px;
  --card-row-gap: 3rem;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  column-gap: var(--gap);
  row-gap: 0;
  padding-bottom: 3rem;
}
.sdv-home-card {
  display: grid;
  ${CARD_ROWS_CSS}
  /* First column holds the featured dot (--dot-w is set per card below). */
  grid-template-columns: var(--dot-w, 0px) minmax(0, 1fr);
  column-gap: 0;
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
    --card-row-gap: 2rem;
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
          <Link
            key={item.slug}
            href={item.href}
            className="sdv-home-card"
            style={item.featured ? ({ "--dot-w": "20px" } as React.CSSProperties) : undefined}
          >
            <ProjectCard
              slug={item.slug}
              title={item.title}
              subtitle={item.subtitle}
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
