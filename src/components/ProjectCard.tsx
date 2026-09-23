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

        {/* Project information: auto-layout column, 3px between the two
            rows. position:relative so the hand-drawn underline below can
            anchor to the bottom of THIS block specifically, rather than
            the whole card. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          {/* Title / Type row — Medium 15px (was 18px: next to the intro
              paragraph's clamp(14px,1.1vw,20px) and the header's 18px
              baseline, 18px-bold titles across a whole grid of cards read
              noticeably heavier than everything around them). Fixed height
              + 2-line clamp on both sides: titles vary a lot in length
              ("Nurtur" vs a full sentence), and without this every card's
              header ends up a different height, which pushes each card's
              image down by a different amount and breaks the grid's row
              alignment. Clamping guarantees this row is always exactly the
              same height, whether the title is one word or four lines'
              worth. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontWeight: 500,
              fontSize: 15,
              lineHeight: 1.2,
              height: 36, // 2 lines * 15px * 1.2 line-height
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

          {/* Timeline / Year row — Light 12px (was 16px, for the same
              reason as the title above — this scales down with it so the
              two rows keep their relative weight to each other). Same
              fixed-height + clamp treatment, but single-line: timeline/year
              text is always short, so a 1-line cap is enough. Timeline only
              exists for case studies (concepts/explorations never have
              one), so it's gated on `variant` rather than just truthiness —
              but the row itself always renders at the same fixed height so
              the layout never shifts between card types, and Year always
              sits on the right. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontWeight: 300,
              fontSize: 12,
              lineHeight: 1.2,
              height: 15, // 1 line * 12px * 1.2 line-height, rounded up
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

          {/* Hand-drawn underline reveal — replaces the circle hover cue
              that used to live on the thumbnail below (that markup and
              its CSS in globals.css are untouched, just unused here, so
              it's ready to reuse elsewhere later). Same restart-on-hover
              trick as the old circle: resetting the img's src forces the
              animated webp to replay its draw-in from frame one every
              time, instead of staying stuck on whatever frame it last
              landed on. Sits in the existing 8px gap between this text
              block and the thumbnail, so it never overlaps the title or
              timeline text — nudge `bottom` on `.title-underline` in
              globals.css if you'd rather it hug the title line itself
              more tightly. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={underlineRef}
            src="/media/effects/title-underline.webp"
            alt=""
            aria-hidden="true"
            className={`title-underline${hovering ? " active" : ""}`}
          />
        </div>
      </div>

      {/* Dedicated wrapper sized exactly to the image, with no overflow
          clipping of its own. */}
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
      </div>
    </div>
  );
}
