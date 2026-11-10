"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Must match the .detail-modal-backdrop.is-closing animation time in
// globals.css (0.2s).
const FADE_OUT_MS = 200;

// Shared shell for both intercepted routes (case studies + explorations).
// router.back() instead of a Link to "/" — this is what actually makes it
// feel like closing a window instead of navigating: it returns to exactly
// wherever the visitor was (scroll position, active Works/Fun filter)
// rather than hard-resetting to the homepage.
//
// Closing fades the modal out first, then goes back. The fade-in on open
// and the soft fade at the card's bottom edge are in globals.css.
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      router.back();
      return;
    }
    setClosing(true);
    timerRef.current = setTimeout(() => router.back(), FADE_OUT_MS);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marks the card when it is scrolled to the very end (or has nothing to
  // scroll), which turns the bottom-edge fade off in globals.css.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    function update() {
      const el = cardRef.current;
      if (!el) return;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      el.setAttribute("data-at-end", atEnd ? "true" : "false");
    }

    update();
    card.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Images and other content change the card's scroll height as they load.
    card.addEventListener("load", update, true);
    const observer = new ResizeObserver(update);
    observer.observe(card);
    Array.from(card.children).forEach((child) => observer.observe(child));

    return () => {
      card.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      card.removeEventListener("load", update, true);
      observer.disconnect();
    };
  }, []);

  return (
    // .detail-modal-backdrop already exists in globals.css (built for
    // exactly this, just never wired into an actual route before) — its
    // own comment has the nav-clearance math worked out already.
    <div
      className={`detail-modal-backdrop${closing ? " is-closing" : ""}`}
      onClick={close}
    >
      <div ref={cardRef} className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="detail-close" aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
