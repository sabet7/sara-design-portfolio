"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STAGES = ["light", "warm", "dusk", "charcoal", "near-black"] as const;
type Stage = (typeof STAGES)[number];

const STORAGE_KEY = "dimmer-stage";
const DARK_STAGES: Stage[] = ["charcoal", "near-black"];

// Icon was hardcoded at 24px inside a 44px button — noticeably small next
// to the button's own footprint (20px of empty padding around it). 30px
// keeps a comfortable ring of padding (7px per side) while reading much
// closer to the button's actual size.
const ICON_SIZE = 30;

// Same graceful-fallback pattern as Header's WeatherIcon and Elie's
// trigger icon (both use onError -> emoji), which this file was
// previously missing: if a hand-drawn icon fails to load, this shows an
// emoji instead of Next's broken-image box.
const ICON_PLACEHOLDER_EMOJI: Record<"sun" | "moon", string> = {
  sun: "☀️",
  moon: "🌙",
};

export default function Dimmer() {
  const [stage, setStage] = useState<Stage>("light");
  const [mounted, setMounted] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Stage | null;
    const initial = stored && STAGES.includes(stored) ? stored : "light";
    setStage(initial);
    document.documentElement.setAttribute("data-dimmer-stage", initial);
    setMounted(true);
  }, []);

  function cycle() {
    const currentIndex = STAGES.indexOf(stage);
    const next = STAGES[(currentIndex + 1) % STAGES.length];
    setStage(next);
    document.documentElement.setAttribute("data-dimmer-stage", next);
    localStorage.setItem(STORAGE_KEY, next);
    // Sun and moon are two different files that can fail independently,
    // so this resets on every cycle rather than sticking once tripped —
    // a broken sun icon shouldn't permanently hide a working moon icon.
    setIconFailed(false);
  }

  if (!mounted) return null;

  const isDark = DARK_STAGES.includes(stage);

  return (
    <button
      onClick={cycle}
      aria-label={`Dimmer: ${stage}. Click to cycle to the next stage.`}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-brand-orange)",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
      }}
    >
      {iconFailed ? (
        <span aria-hidden="true" style={{ fontSize: ICON_SIZE * 0.8, lineHeight: 1 }}>
          {isDark ? ICON_PLACEHOLDER_EMOJI.moon : ICON_PLACEHOLDER_EMOJI.sun}
        </span>
      ) : (
        <Image
          src={isDark ? "/media/icons/dimmer-moon.webp" : "/media/icons/dimmer-sun.webp"}
          alt=""
          width={ICON_SIZE}
          height={ICON_SIZE}
          unoptimized
          onError={() => setIconFailed(true)}
        />
      )}
    </button>
  );
}
