"use client";

import Dimmer from "./Dimmer";
import Elie from "./Elie";

const FILTERS = ["All", "Product", "Web", "Brand", "Creative"] as const;
export type Filter = (typeof FILTERS)[number];

interface LiquidNavProps {
  active: Filter;
  onChange: (f: Filter) => void;
}

export default function LiquidNav({ active, onChange }: LiquidNavProps) {
  return (
    <nav className="sara-float-nav">
      {FILTERS.map((f) => (
        <button
          key={f}
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

