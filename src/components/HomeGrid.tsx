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

const NAMED_FILTERS = ["Product", "Web", "Brand"] as const;

function matchesFilter(item: CardData, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Creative") {
    // Creative is a catch-all — anything that doesn't match one of the
    // three named categories, rather than needing a literal "Creative"
    // tag that nothing in the content actually has.
    return !NAMED_FILTERS.some((named) =>
      item.types.some((t) => t.toLowerCase().includes(named.toLowerCase()))
    );
  }
  const target = filter.toLowerCase();
  return item.types.some((t) => t.toLowerCase().includes(target));
}

export default function HomeGrid({ items }: { items: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = items.filter((item) => matchesFilter(item, filter));

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1.5rem",
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
