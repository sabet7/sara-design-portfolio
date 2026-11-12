"use client";

import { useEffect, useRef, useState } from "react";
import { ViewTransition } from "react";
import SkeletonImage from "@/components/SkeletonImage";

interface ProjectCardProps {
  slug: string;
  title: string;
  /** Shown in small gray text just under the title (case study cards pass
   *  the one-liner). Omit it and the card is laid out exactly as before. */
  subtitle?: string;
  year: string;
  types: string[];
  thumbnailSrc: string;
  gifSrc?: string;
  variant: "case-study" | "exploration";
  featured?: boolean;
  /** No longer shown on the card (it still appears in the project modal).
   *  Kept as an optional prop so HomeGrid can keep passing it. */
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

// Tag for a project type: a plain outlined pill, no colors. It uses the
// muted gray (#4a4a4a), so it stays readable at every dimmer position.
function tagStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    height: 22,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid rgb(var(--fg-muted))",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    background: "transparent",
    color: "rgb(var(--fg-muted))",
  };
}

export default function ProjectCard({
  slug,
  title,
  subtitle,
  year,
  types,
  thumbnailSrc,
  gifSrc,
  variant,
  featured,
  onClick,
}: ProjectCardProps) {
  const [hovering, setHovering] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const underlineRef = useRef<HTMLImageElement | null>(null);

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
    // Every card gets the hover state (brightness, title underline, "View
    // more" pill). The GIF only swaps in when gifSrc exists (see showGif).
    setHovering(true);
    restart(underlineRef.current);
  }

  function handleMouseLeave() {
    setHovering(false);
  }

  // LAYOUT. This component renders no box of its own (display: contents).
  // Its pieces are placed directly into the grid that HomeGrid.tsx sets up
  // on each card's link, which has three rows shared with the other cards in
  // the same row of the page:
  //   row 1  tag + year
  //   row 2  title + one-liner (together, so the one-liner always sits right
  //          under its own title)
  //   row 3  image
  // Sharing the rows is what lines the images up across a row of cards while
  // each row is only as tall as its tallest text, with no fixed block
  // reserved. All gaps are the --card-* variables in HomeGrid.tsx.
  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: "contents", cursor: onClick ? "pointer" : undefined }}
    >
      {featured && (
        <span
          aria-hidden="true"
          style={{
            gridColumn: 1,
            gridRow: "1 / 3",
            alignSelf: "center",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--color-featured)",
          }}
        />
      )}

      {/* Row 1: project type tag on the left, year on the right. */}
      <div
        style={{
          gridColumn: 2,
          gridRow: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          height: 22,
        }}
      >
        {types.slice(0, MAX_TYPES_ON_CARD).map((type) => (
          <span key={type} style={tagStyle()}>
            {type}
          </span>
        ))}
        <span
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontWeight: 300,
            fontSize: 12,
            lineHeight: 1.2,
            opacity: 0.6,
          }}
        >
          {year}
        </span>
      </div>

      {/* Row 2: title (Medium 15px, up to 2 lines) with the one-liner
          (13px, up to 2 lines) directly under it. alignSelf: start makes this
          block exactly as tall as its own text, so the hand-drawn underline
          (top: 100%, see .title-underline in globals.css) lands right under
          the last line of text and never across it. */}
      <div
        style={{
          gridColumn: 2,
          gridRow: 2,
          alignSelf: "start",
          position: "relative",
          marginTop: "var(--card-tag-title, 7px)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.2,
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {subtitle && (
          <p
            style={{
              margin: "var(--card-title-sub, 3px) 0 0",
              fontWeight: 300,
              fontSize: 13,
              lineHeight: "17px",
              color: "rgb(var(--fg-muted))",
              overflowWrap: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Hand-drawn underline reveal. Same restart-on-hover trick as before:
            resetting the img's src makes the animated webp replay its draw-in
            from frame one every time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={underlineRef}
          src="/media/effects/title-underline.webp"
          alt=""
          aria-hidden="true"
          className={`title-underline${hovering ? " active" : ""}`}
        />
      </div>

      {/* Row 3: the image, across the full width of the card (including the
          column the featured dot sits in). */}
      <div
        style={{
          gridColumn: "1 / -1",
          gridRow: 3,
          position: "relative",
          marginTop: "var(--card-text-media, 12px)",
          marginBottom: "var(--card-row-gap, 3rem)",
        }}
      >
        <div
          className="project-card-media"
          style={
            {
              "--accent": ACCENT[variant],
            } as React.CSSProperties
          }
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
              <SkeletonImage src={thumbnailSrc} alt={title} fill style={{ objectFit: "cover" }} />
            )}
          </ViewTransition>
        </div>
      </div>
    </div>
  );
}
