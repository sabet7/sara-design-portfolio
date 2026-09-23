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

  // Real cursor-tracked "light on glass" highlight — this is the actual
  // light-reactivity piece, as opposed to the always-on ambient sweep
  // animation living in globals.css (.sara-float-nav::before), which just
  // keeps the pill feeling alive when nobody's touching it. Written
  // directly to the DOM via refs/setProperty rather than React state,
  // since pointermove fires far too often to put through a re-render —
  // this way moving the mouse over the pill costs nothing beyond updating
  // two CSS custom properties, which the browser is already optimized to
  // repaint cheaply.
  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    const nav = navRef.current;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    nav.style.setProperty("--glare-x", `${x}%`);
    nav.style.setProperty("--glare-y", `${y}%`);
  }

  function handlePointerEnter() {
    navRef.current?.setAttribute("data-glare", "on");
  }

  function handlePointerLeave() {
    // Not removed instantly — see the opacity transition on
    // .sara-float-nav-glare in globals.css, which fades it out instead of
    // snapping it away the moment the cursor steps off the glass.
    navRef.current?.setAttribute("data-glare", "off");
  }

  return (
    <nav
      className="sara-float-nav"
      ref={navRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* The cursor-follow highlight itself — a real element rather than a
          third pseudo-element, since .sara-float-nav already spends its
          ::before/::after budget on the ambient sheen sweep and the
          frosted noise texture. Purely decorative (aria-hidden), and
          pointer-events: none in CSS so it never intercepts clicks meant
          for the filter buttons underneath. */}
      <div className="sara-float-nav-glare" aria-hidden="true" />

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

