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
  href: string;
}

export default function HomeGrid({ items }: { items: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const visible =
    filter === "All"
      ? items
      : items.filter((item) =>
          item.types.some((t) => t.toLowerCase() === filter.toLowerCase())
        );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
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
              title={item.title}
              year={item.year}
              types={item.types}
              thumbnailSrc={item.thumbnailSrc}
              gifSrc={item.gifSrc}
              variant={item.variant}
            />
          </Link>
        ))}
      </div>
      <LiquidNav active={filter} onChange={setFilter} />
    </>
  );
}
