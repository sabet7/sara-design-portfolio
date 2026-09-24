"use client";

import { useEffect, useRef, useState } from "react";

interface Section {
  label: string;
  id: string;
}

export default function DetailSidebar({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  // Which item is currently hovered, if any — drives which pair of
  // hover-circle images shows its "active" class. Only one at a time
  // since a mouse can only be over one link, so a single id is enough
  // (no need for a per-item boolean map).
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Refs keyed by section id rather than a single ref each, since there
  // are N links here (not one image like the old project-card circle) —
  // each needs its own <img> restarted independently on its own hover.
  const lightRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const darkRefs = useRef<Record<string, HTMLImageElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  // Same restart trick the project cards used: resetting an animated
  // webp's own src forces it to replay its draw-in from frame one, since
  // a browser won't otherwise rewind an already-played animated image on
  // its own hover-to-hover.
  function restart(img: HTMLImageElement | null) {
    if (!img) return;
    const src = img.src;
    img.src = "";
    requestAnimationFrame(() => {
      img.src = src;
    });
  }

  function handleMouseEnter(id: string) {
    setHoveredId(id);
    restart(lightRefs.current[id]);
    restart(darkRefs.current[id]);
  }

  function handleMouseLeave() {
    setHoveredId(null);
  }

  return (
    <nav className="detail-sidebar">
      {sections.map(({ label, id }) => (
        <div
          key={id}
          className="detail-sidebar-item"
          onMouseEnter={() => handleMouseEnter(id)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Same two assets as the old project-card hover circle
              (untouched in globals.css, reused here rather than
              duplicated) — sized for a short text label instead of a
              thumbnail image via the new .detail-sidebar-hover-circle
              rule, not the original .hover-circle sizing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              lightRefs.current[id] = el;
            }}
            src="/media/effects/hover-circle-light.webp"
            alt=""
            aria-hidden="true"
            className={`detail-sidebar-hover-circle hover-circle-light${
              hoveredId === id ? " active" : ""
            }`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              darkRefs.current[id] = el;
            }}
            src="/media/effects/hover-circle-dark.webp"
            alt=""
            aria-hidden="true"
            className={`detail-sidebar-hover-circle hover-circle-dark${
              hoveredId === id ? " active" : ""
            }`}
          />
          <a
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={active === id ? "active" : ""}
          >
            {label}
          </a>
        </div>
      ))}
    </nav>
  );
}
