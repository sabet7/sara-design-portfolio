"use client";

import { useEffect, useRef } from "react";

// Replaces the normal cursor with a small orange dot.
// Over a project card the dot grows into an orange "View" bubble. To show
// the bubble on anything else, add data-cursor="Label" to that element.
// The normal cursor stays over text fields, the doodle canvas and the Elie
// drag handle. Not used on touch screens.

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
.sdv-cur-in {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  margin: -38px 0 0 -38px;
  border-radius: 50%;
  background: var(--color-brand-orange, #e8581c);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transform: scale(0.158); /* 12px dot */
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.sdv-cur-text {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.sdv-cur[data-label="true"] .sdv-cur-in { transform: scale(1); }
.sdv-cur[data-label="true"] .sdv-cur-text { opacity: 1; transition: opacity 0.2s ease 0.12s; }
.sdv-cur[data-label="true"][data-down="true"] .sdv-cur-in { transform: scale(0.9); }
`;

const NATIVE = 'input, textarea, select, [contenteditable="true"], canvas, .elie-handle';
const CARD = '.project-card-media, a[href^="/case-studies/"], a[href^="/explorations/"]';

export default function CursorFollower() {
  const curRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cur = curRef.current;
    const text = textRef.current;
    if (!cur || !text) return;
    const root = document.documentElement;
    let started = false;

    function onMove(e: MouseEvent) {
      if (!cur || !text) return;
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
        text.textContent = labelled.getAttribute("data-cursor") || "View";
        cur.setAttribute("data-label", "true");
      } else if (target.closest(CARD)) {
        text.textContent = "View";
        cur.setAttribute("data-label", "true");
      } else {
        cur.setAttribute("data-label", "false");
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
        <div className="sdv-cur-in">
          <span className="sdv-cur-text" ref={textRef}>
            View
          </span>
        </div>
      </div>
    </>
  );
}
