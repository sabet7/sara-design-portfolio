"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STAGES = ["light", "warm", "dusk", "charcoal", "near-black"] as const;
type Stage = (typeof STAGES)[number];

const STORAGE_KEY = "dimmer-stage";
const DARK_STAGES: Stage[] = ["charcoal", "near-black"];

export default function Dimmer() {
  const [stage, setStage] = useState<Stage>("light");
  const [mounted, setMounted] = useState(false);

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
  }

  if (!mounted) return null;

  const isDark = DARK_STAGES.includes(stage);

  return (
    <button
      onClick={cycle}
      aria-label={`Dimmer: ${stage}. Click to cycle to the next stage.`}
      style={{
        width: 52,
        height: 52,
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
      <Image
        src={isDark ? "/media/icons/dimmer-moon.webp" : "/media/icons/dimmer-sun.webp"}
        alt=""
        width={24}
        height={24}
        unoptimized
      />
    </button>
  );
}
