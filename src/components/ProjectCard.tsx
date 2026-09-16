"use client";

import { useEffect, useRef, useState } from "react";
import { ViewTransition } from "react";
import Image from "next/image";

interface ProjectCardProps {
  slug: string;
  title: string;
  year: string;
  types: string[];
  thumbnailSrc: string;
  gifSrc?: string;
  variant: "case-study" | "exploration";
  featured?: boolean;
  /** Not yet wired from CardData/frontmatter — pass it through once that
   *  field exists. Row still renders correctly (just without a second
   *  line) if this is left undefined. */
  timeline?: string;
  onClick?: () => void;
}

const ACCENT: Record<ProjectCardProps["variant"], string> = {
  "case-study": "255 128 0",
  exploration: "99 198 255",
};

// Card shows only the primary type to keep the header row from crowding
// the title — the full `types` array is untouched here and still reaches
// the case study detail page exactly as before, since that page reads
// frontmatter independently rather than through this component.
const MAX_TYPES_ON_CARD = 1;

export default function ProjectCard({
  slug,
  title,
  year,
  types,
  thumbnailSrc,
  gifSrc,
  variant,
  featured,
  timeline,
  onClick,
}: ProjectCardProps) {
  const [hovering, setHovering] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const lightRef = useRef<HTMLImageElement | null>(null);
  const darkRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const showGif = canHover && hovering && Boolean(gifSrc);

  function restart(img: HTMLImageElement | null) {
    if (!img) return;
    const src = img.src;
    img.src = "";
    requestAnimationFrame(() => {
      img.src = src;
    });
  }

  function handleMouseEnter() {
    setHovering(true);
    restart(lightRef.current);
    restart(darkRef.current);
  }

  function handleMouseLeave() {
    setHovering(false);
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: onClick ? "pointer" : undefined, position: "relative" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
          fontSize: 13,
          minHeight: "2.6em",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: "1 1 auto" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            {featured && (
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--color-featured)",
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ overflowWrap: "break-word" }}>{title}</span>
          </span>
          {timeline && <span style={{ opacity: 0.6 }}>{timeline}</span>}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "flex-end",
            textAlign: "right",
            flexShrink: 0,
            maxWidth: "45%",
          }}
        >
          <span style={{ fontWeight: 700 }}>{types.slice(0, MAX_TYPES_ON_CARD).join(" · ")}</span>
          <span style={{ opacity: 0.6 }}>{year}</span>
        </div>
      </div>

      {/* Dedicated wrapper sized exactly to the image, with no overflow
          clipping of its own — this is what the hover-circle actually
          anchors to now, instead of the whole card (title block included). */}
      <div style={{ position: "relative" }}>
        <div
          className="project-card-media"
          style={{ "--accent": ACCENT[variant] } as React.CSSProperties}
        >
          <div className="project-card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 15l-5-5-9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Image</span>
          </div>

          <ViewTransition name={`project-media-${slug}`}>
            {showGif ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gifSrc}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Image src={thumbnailSrc} alt={title} fill style={{ objectFit: "cover" }} />
            )}
          </ViewTransition>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={lightRef}
          src="/media/effects/hover-circle-light.webp"
          alt=""
          aria-hidden="true"
          className={`hover-circle hover-circle-light${hovering ? " active" : ""}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={darkRef}
          src="/media/effects/hover-circle-dark.webp"
          alt=""
          aria-hidden="true"
          className={`hover-circle hover-circle-dark${hovering ? " active" : ""}`}
        />
      </div>
    </div>
  );
}
