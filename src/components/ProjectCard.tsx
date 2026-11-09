"use client";

import { useEffect, useRef, useState } from "react";
import { ViewTransition } from "react";
import SkeletonImage from "@/components/SkeletonImage";

interface ProjectCardProps {
  slug: string;
  title: string;
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
// muted gray (#777777), so it stays readable at every dimmer position.
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
  const titleRef = useRef<HTMLSpanElement | null>(null);
  // Distance from the top of the text block to just under the last line of
  // the title (the tag/year row above it is included via offsetTop). The
  // title row is a fixed 36px tall (two lines), so a
  // one-line title would leave a gap if the underline were pinned to the
  // bottom of the row. The height of the text itself is measured here so
  // the line sits directly under however many lines the title actually
  // uses, and re-measured when the card width changes the line count.
  const [underlineTop, setUnderlineTop] = useState<number | null>(null);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const textHeight = Math.min(range.getBoundingClientRect().height, el.offsetHeight);
      setUnderlineTop(el.offsetTop + Math.round(textHeight) - 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title]);

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

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: onClick ? "pointer" : undefined, position: "relative" }}
    >
      {/* Outer horizontal wrapper: featured dot (21x21) on the left, project
          info (type + year, then title) filling the rest. Dot is centered
          against the full height of the text stack. */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          // 16px (was 8) so the hand-drawn underline, which hangs about 12px
          // below the title, clears the image.
          marginBottom: 16,
        }}
      >
        {featured && (
          <span
            aria-hidden="true"
            style={{
              // Was 21/21, then 14/14 — still read as too big next to a
              // 15px title. 8px is a small status dot, not a shape
              // competing with the text for attention.
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-featured)",
              flexShrink: 0,
            }}
          />
        )}

        {/* Project information: auto-layout column, 7px between the two
            rows (was 3px: the extra room is where the hand-drawn underline
            sits when the title uses both of its lines). position:relative so the hand-drawn underline below can
            anchor to the bottom of THIS block specifically, rather than
            the whole card. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          {/* Top row: project type tag on the left, year on the right. It
              sits above the title so the hand-drawn underline can sit
              directly beneath the title with nothing in between. Fixed
              height (the tag's own 22px) so every card's header is the same
              height and the image row stays aligned across the grid. */}
          <div
            style={{
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

          {/* Title: Medium 15px. Fixed height + 2-line clamp, same as before:
              titles vary a lot in length, and without this every card's header
              ends up a different height, which pushes each card's image down
              by a different amount and breaks the grid's row alignment. */}
          <div
            style={{
              display: "flex",
              fontWeight: 500,
              fontSize: 15,
              lineHeight: 1.2,
              height: 36, // 2 lines * 15px * 1.2 line-height
            }}
          >
            <span
              ref={titleRef}
              style={{
                overflowWrap: "break-word",
                minWidth: 0,
                flex: "1 1 auto",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </span>
          </div>

          {/* Hand-drawn underline reveal — replaces the circle hover cue
              that used to live on the thumbnail below (that markup and
              its CSS in globals.css are untouched, just unused here, so
              it's ready to reuse elsewhere later). Same restart-on-hover
              trick as the old circle: resetting the img's src forces the
              animated webp to replay its draw-in from frame one every
              time, instead of staying stuck on whatever frame it last
              landed on. Positioned from the top of this block using the
              measured title height (underlineTop above), so it sits
              directly under the title's last line. To move it closer or
              further, change the `- 1` in that measurement. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={underlineRef}
            src="/media/effects/title-underline.webp"
            alt=""
            aria-hidden="true"
            className={`title-underline${hovering ? " active" : ""}`}
            style={
              underlineTop === null
                ? undefined
                : { top: underlineTop, bottom: "auto" }
            }
          />
        </div>
      </div>

      {/* Dedicated wrapper sized exactly to the image, with no overflow
          clipping of its own. */}
      <div style={{ position: "relative" }}>
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
