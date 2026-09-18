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
      {/* Outer horizontal wrapper: featured dot (21x21) on the left, project
          info (title/type + timeline/year) filling the rest. Dot is centered
          against the full height of the two-row text stack. */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        {featured && (
          <span
            aria-hidden="true"
            style={{
              width: 21,
              height: 21,
              borderRadius: "50%",
              background: "var(--color-featured)",
              flexShrink: 0,
            }}
          />
        )}

        {/* Project information: auto-layout column, 3px between the two rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          {/* Title / Type row — Medium 18px. Fixed height + 2-line clamp on
              both sides: titles vary a lot in length ("Nurtur" vs a full
              sentence), and without this every card's header ends up a
              different height, which pushes each card's image down by a
              different amount and breaks the grid's row alignment. Clamping
              guarantees this row is always exactly the same height, whether
              the title is one word or four lines' worth. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontWeight: 500,
              fontSize: 18,
              lineHeight: 1.2,
              height: 44, // 2 lines * 18px * 1.2 line-height
            }}
          >
            <span
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
            <span
              style={{
                flexShrink: 0,
                maxWidth: "45%",
                textAlign: "right",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {types.slice(0, MAX_TYPES_ON_CARD).join(" · ")}
            </span>
          </div>

          {/* Timeline / Year row — Light 16px. Same fixed-height + clamp
              treatment, but single-line: timeline/year text is always
              short, so a 1-line cap is enough. Timeline only exists for
              case studies (concepts/explorations never have one), so it's
              gated on `variant` rather than just truthiness — but the row
              itself always renders at the same fixed height so the layout
              never shifts between card types, and Year always sits on the
              right. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.2,
              height: 19, // 1 line * 16px * 1.2 line-height
              opacity: 0.6,
            }}
          >
            <span
              style={{
                minWidth: 0,
                flex: "1 1 auto",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {variant === "case-study" ? timeline : null}
            </span>
            <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{year}</span>
          </div>
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
              <SkeletonImage src={thumbnailSrc} alt={title} fill style={{ objectFit: "cover" }} />
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
