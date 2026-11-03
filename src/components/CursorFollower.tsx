"use client";

import { useEffect, useRef } from "react";

// Replaces the normal cursor with a small orange dot.
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
.sdv-dot {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: var(--color-brand-orange, #e8581c);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  will-change: transform;
}
.sdv-dot[data-show="true"] { opacity: 1; }
.sdv-dot[data-hidden="true"] { opacity: 0; }
`;

const NATIVE = 'input, textarea, select, [contenteditable="true"], canvas, .elie-handle';

export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = dotRef.current;
    if (!dot) return;
    const root = document.documentElement;
    let started = false;

    function onMove(e: MouseEvent) {
      if (!dot) return;
      if (!started) {
        started = true;
        root.setAttribute("data-sdv-cursor", "");
        dot.setAttribute("data-show", "true");
      }
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const target = e.target;
      const native = target instanceof Element && target.closest(NATIVE) !== null;
      dot.setAttribute("data-hidden", native ? "true" : "false");
    }
    function onLeave() {
      dot?.setAttribute("data-show", "false");
    }
    function onEnter() {
      if (started) dot?.setAttribute("data-show", "true");
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("mouseenter", onEnter);
      root.removeAttribute("data-sdv-cursor");
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="sdv-dot" ref={dotRef} aria-hidden="true" />
    </>
  );
}
