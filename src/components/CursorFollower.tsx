"use client";

import { useEffect, useRef } from "react";

// Replaces the normal cursor with a small orange dot.
// Over a project card the dot is replaced by an orange "View more" pill with
// an animated icon on its left (public/media/cursor/view-icon.webp). If that
// file doesn't exist yet, the pill shows just the text. To show the pill on
// anything else, add data-cursor="Label" to that element.
// The normal cursor stays over text fields, the doodle canvas and the Elie
// drag handle. Not used on touch screens.

const ICON_SRC = "/media/cursor/view-icon.webp";
const PILL_COLOR = "var(--color-brand-orange, #f65009)";

const CSS = `
html[data-sdv-cursor] body,
html[data-sdv-cursor] a,
html[data-sdv-cursor] button,
html[data-sdv-cursor] [role="button"],
html[data-sdv-cursor] summary,
html[data-sdv-cursor] label,
html[data-sdv-cursor] [style*="cursor: pointer"] {
  cursor: none !important;
}
.sdv-cur {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  will-change: transform;
}
.sdv-cur[data-show="true"] { opacity: 1; }
.sdv-cur[data-hidden="true"] { opacity: 0; }

.sdv-cur-dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: var(--color-brand-orange, #f65009);
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.15s ease;
}
.sdv-cur[data-label="true"] .sdv-cur-dot { transform: scale(0); opacity: 0; }

.sdv-cur-pill {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  height: 37px;
  padding: 0 14px 0 12px;
  border-radius: 999px;
  background: ${PILL_COLOR};
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.15s ease;
}
.sdv-cur[data-label="true"] .sdv-cur-pill {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}
.sdv-cur[data-label="true"][data-down="true"] .sdv-cur-pill {
  transform: translate(-50%, -50%) scale(0.94);
}
.sdv-cur-icon {
  display: block;
  width: auto;
  height: 22px;
  flex-shrink: 0;
}
.sdv-cur-pill span {
  flex-shrink: 0;
}
`;

const NATIVE = 'input, textarea, select, [contenteditable="true"], canvas, .elie-handle';
const CARD = '.project-card-media, a[href^="/case-studies/"], a[href^="/explorations/"]';

export default function CursorFollower() {
  const curRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cur = curRef.current;
    const text = textRef.current;
    if (!cur || !text) return;
    const root = document.documentElement;
    let started = false;
    let labelOn = false;

    // Restarts the animated icon from its first frame each time the pill
    // appears (same trick as the title underline on project cards).
    function restartIcon() {
      const img = iconRef.current;
      if (!img) return;
      // Shown again on every appearance, so a file added after the page
      // loaded is picked up without a full reload.
      img.style.display = "";
      img.src = "";
      requestAnimationFrame(() => {
        img.src = ICON_SRC;
      });
    }

    function setLabel(on: boolean, label?: string) {
      if (on && label !== undefined && text) text.textContent = label;
      if (on === labelOn) return;
      labelOn = on;
      cur?.setAttribute("data-label", on ? "true" : "false");
      if (on) restartIcon();
    }

    function onMove(e: MouseEvent) {
      if (!cur) return;
      if (!started) {
        started = true;
        root.setAttribute("data-sdv-cursor", "");
        cur.setAttribute("data-show", "true");
      }
      cur.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      const target = e.target;
      if (!(target instanceof Element)) return;
      cur.setAttribute("data-hidden", target.closest(NATIVE) ? "true" : "false");

      const labelled = target.closest("[data-cursor]");
      if (labelled) {
        setLabel(true, labelled.getAttribute("data-cursor") || "View more");
      } else if (target.closest(CARD)) {
        setLabel(true, "View more");
      } else {
        setLabel(false);
      }
    }
    function onDown() {
      cur?.setAttribute("data-down", "true");
    }
    function onUp() {
      cur?.setAttribute("data-down", "false");
    }
    function onLeave() {
      cur?.setAttribute("data-show", "false");
    }
    function onEnter() {
      if (started) cur?.setAttribute("data-show", "true");
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("mouseenter", onEnter);
      root.removeAttribute("data-sdv-cursor");
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="sdv-cur" ref={curRef} aria-hidden="true">
        <div className="sdv-cur-dot" />
        <div className="sdv-cur-pill">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={iconRef}
            className="sdv-cur-icon"
            src={ICON_SRC}
            alt=""
            draggable={false}
            onLoad={(e) => {
              e.currentTarget.style.display = "";
            }}
            onError={(e) => {
              // Ignore the error the browser fires for the empty src used to
              // restart the animation; hide the icon only if the file is missing.
              if (e.currentTarget.getAttribute("src")) e.currentTarget.style.display = "none";
            }}
          />
          <span ref={textRef}>View more</span>
        </div>
      </div>
    </>
  );
}
