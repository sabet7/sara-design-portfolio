"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProjectCardProps {
  title: string;
  year: string;
  types: string[];
  thumbnailSrc: string;
  gifSrc?: string;
  variant: "case-study" | "exploration";
  featured?: boolean;
  onClick?: () => void;
}

const ACCENT: Record<ProjectCardProps["variant"], string> = {
  "case-study": "255 128 0",
  exploration: "99 198 255",
};

export default function ProjectCard({
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

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const showGif = canHover && hovering && Boolean(gifSrc);

  return (
    <div onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <div
        className="project-card-media"
        style={{ "--accent": ACCENT[variant] } as React.CSSProperties}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="project-card-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 15l-5-5-9 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>Image</span>
        </div>

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

        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {types.map((t) => (
            <span key={t} className={`tag ${variant}`}>
              {t}
            </span>
          ))}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/effects/hover-circle-light.webp"
          alt=""
          aria-hidden="true"
          className="hover-circle hover-circle-light"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/effects/hover-circle-dark.webp"
          alt=""
          aria-hidden="true"
          className="hover-circle hover-circle-dark"
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
          {featured && (
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-featured)",
                flexShrink: 0,
              }}
            />
          )}
          {title}
        </span>
        <span style={{ opacity: 0.6 }}>{year}</span>
      </div>
    </div>
  );
}
