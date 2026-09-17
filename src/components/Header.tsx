"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "./Button";

const NYC_LAT = 40.7128;
const NYC_LON = -74.006;

function weatherIcon(code: number | null, isDay: boolean): string {
  if (code === null) return "☀️";
  if (code === 0) return isDay ? "☀️" : "🌙";
  if ([1, 2, 3].includes(code)) return isDay ? "⛅" : "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "☀️";
}

// Cycles between the two lines, fading each word out and back in with a
// slight per-word stagger rather than a flat block cross-fade.
const SUBTEXT_PHRASES = [
  "Product designer (and developer)",
  "Connecting businesses to users with design",
];
const HOLD_MS = 2600;
const FADE_MS = 450;

function RotatingSubtext() {
  const [index, setIndex] = useState(0);
  // 'in': settled and visible. 'out': the current phrase animating away.
  // 'entering': the new phrase just mounted in its hidden pose, about to
  // be flipped to 'in' on the next frame so the transition actually has
  // something to animate from — without this extra step, setting the new
  // phrase's index and its visible state in the same update means it
  // renders straight into its final pose with no transition ever playing.
  const [phase, setPhase] = useState<"in" | "out" | "entering">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIndex((i) => (i + 1) % SUBTEXT_PHRASES.length);
        setPhase("entering");
        // Two rAFs: the first lets the "entering" (hidden-pose) render
        // actually commit and paint; only then does flipping to "in" on
        // the following frame register as a genuine style change for the
        // browser to transition, rather than being coalesced into the
        // same paint as the initial hidden pose.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setPhase("in"));
        });
      }, FADE_MS);
    }, HOLD_MS + FADE_MS);
    return () => clearInterval(interval);
  }, []);

  const visible = phase === "in";
  // Both the outgoing phrase's exit target AND the incoming phrase's
  // entry start use this same angle — like a single drum that always
  // rotates the same direction: the front face tips back through -80deg
  // and out of view, and the next face continues that same motion,
  // arriving back at 0deg from that same -80deg position. That's what
  // makes "Product Designer" rotating away and "Connecting..." rotating
  // in read as two faces of one cylinder rather than two separate,
  // independently-directed animations. If this reads as spinning the
  // wrong way once you see it live, flip the sign to 80deg on both.
  const HIDDEN_ANGLE = -80;

  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 500,
        opacity: 0.65,
        minHeight: "1.3em",
        width: 280,
        display: "block",
        perspective: "500px",
      }}
    >
      <span
        key={index}
        style={{
          display: "inline-block",
          transformOrigin: "50% 50%",
          backfaceVisibility: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "rotateX(0deg)" : `rotateX(${HIDDEN_ANGLE}deg)`,
          transition: `transform ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${FADE_MS}ms ease`,
        }}
      >
        {SUBTEXT_PHRASES[index]}
      </span>
    </span>
  );
}

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const [tempF, setTempF] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${NYC_LAT}&longitude=${NYC_LON}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`
    )
      .then((res) => res.json())
      .then((data) => {
        setTempF(Math.round(data.current.temperature_2m));
        setWeatherCode(data.current.weather_code);
        setIsDay(data.current.is_day === 1);
      })
      .catch(() => {
        setTempF(null);
        setWeatherCode(null);
      });
  }, []);

  const timeString = now
    ? now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const dateString = now
    ? now.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          // Matches <main>'s "0 3rem 3rem" side padding in page.tsx —
          // these two were out of sync (2rem here vs 3rem there), which is
          // why "Sara Del Villar" didn't line up with the intro paragraph
          // or the grid's left/right edges even though everything looked
          // individually centered.
          padding: "1.5rem 3rem",
          fontSize: 18,
          fontWeight: 500,
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, marginRight: "2.5rem" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            <strong style={{ fontSize: 20, fontWeight: 800 }}>Sara Del Villar</strong>
          </Link>
          <RotatingSubtext />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingTop: 3 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#03C000",
              display: "inline-block",
            }}
          />
          <span>Available September 2026</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span>Services</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Product design</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Web design</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Interaction design</span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem", color: "inherit" }}>
          <a href="/resume.pdf" style={{ color: "inherit" }}>
            Resume
          </a>
          <Button href="mailto:sedelvillar104@gmail.com" fontSize={16}>
            Connect
          </Button>
          <a
            href="https://github.com/sabet7"
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit" }}
          >
            Github
          </a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
            X
          </a>
        </nav>

        {now && (
          <span style={{ paddingTop: 3 }}>
            {dateString} {timeString} EST - New York{" "}
            {tempF !== null ? `${weatherIcon(weatherCode, isDay)} ${tempF}°F` : ""}
          </span>
        )}
      </header>

      <span
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          fontSize: 10,
          color: "#b3b3b3",
          fontWeight: 400,
          zIndex: 50,
        }}
      >
        v5
      </span>
    </>
  );
}
