"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Dimmer from "./Dimmer";
import Elie from "./Elie";

const FILTERS = ["All", "Product", "Web", "Brand", "Creative"] as const;
export type Filter = (typeof FILTERS)[number];

interface LiquidNavProps {
  active: Filter;
  onChange: (f: Filter) => void;
}

export default function LiquidNav({ active, onChange }: LiquidNavProps) {
  const navRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Partial<Record<Filter, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState<{
    left: number;
    width: number;
    top: number;
    height: number;
  } | null>(null);

  // Measures the active button's actual rendered position/size and moves
  // the sliding pill there — real measurement instead of hardcoded offsets,
  // so it stays correct regardless of padding, font, or label length. top/
  // height are measured too (not just left/width) because this row also
  // holds Elie's icon and the Dimmer control, which may be a different
  // height than the filter buttons — a fixed CSS inset would drift out of
  // vertical alignment with the actual button.
  useLayoutEffect(() => {
    function measure() {
      const nav = navRef.current;
      const button = buttonRefs.current[active];
      if (!nav || !button) return;
      const navRect = nav.getBoundingClientRect();
      const btnRect = button.getBoundingClientRect();
      setPill({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
        top: btnRect.top - navRect.top,
        height: btnRect.height,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    <nav className="sara-float-nav" ref={navRef}>
      {pill && (
        <div
          className="float-nav-pill"
          aria-hidden="true"
          style={{
            // Real left/width/top/height, not a scaleX transform. scaleX
            // stretches the whole rendered box — border-radius included —
            // so a pill scaled up from a 1px base ends up with its rounded
            // caps stretched into flat-looking, barely-curved edges, which
            // also reads as the box "trailing" past where the text
            // actually ends. Animating left/width directly keeps the
            // border-radius a real, constant 999px at any size, so the
            // ends stay crisply round and the box's edge lines up exactly
            // with the button underneath. The earlier "hop" bug wasn't
            // actually caused by animating width — it was the old
            // per-button nav-bounce animation firing at the same time
            // (see .float-nav-item.active in globals.css), which is
            // already removed.
            left: pill.left,
            width: pill.width,
            top: pill.top,
            height: pill.height,
          }}
        />
      )}
      {FILTERS.map((f) => (
        <button
          key={f}
          ref={(el) => {
            buttonRefs.current[f] = el;
          }}
          className={`float-nav-item ${active === f ? "active" : ""}`}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
      <div className="float-nav-divider" />
      <Elie />
      <Dimmer />
    </nav>
  );
}
