"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "./Button";

const NYC_LAT = 40.7128;
const NYC_LON = -74.006;

// Set this once you actually have a job — replace null with the company
// name (e.g. "Duolingo") and the header switches from an auto-updating
// "Available <month>" to "Currently at <company>" on its own, everywhere
// this renders. Flip it back to null between jobs and the availability
// line just resumes where it left off — no other code to touch either
// way.
const CURRENT_EMPLOYER: string | null = null;

// The if/else you asked for: employed takes priority and shows a fixed
// "Currently at X"; otherwise this always reflects the ACTUAL current
// month/year (not a typed-in one), so it rolls over on its own at every
// month boundary — and at every December→January year boundary too,
// since it's reading both straight off the real date instead of a
// separately hardcoded pair.
function getAvailabilityLabel(now: Date): string {
  if (CURRENT_EMPLOYER) return `Currently at ${CURRENT_EMPLOYER}`;
  const month = now.toLocaleDateString("en-US", {
    month: "long",
    timeZone: "America/New_York",
  });
  const year = now.toLocaleDateString("en-US", {
    year: "numeric",
    timeZone: "America/New_York",
  });
  return `Available ${month} ${year}`;
}

// Emoji fallback — used until your hand-drawn icon for a given condition
// exists (or if one ever fails to load), so the weather section never
// shows a broken image.
function weatherEmoji(code: number | null, isDay: boolean): string {
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

// Maps the same weather codes to your hand-drawn icon files. Drop each
// file in at the path below as you finish drawing it — nothing else
// changes. Until a given file exists, WeatherIcon's onError silently
// falls back to the matching emoji above, so missing ones just look like
// they do today rather than breaking.
function weatherIconSrc(code: number | null, isDay: boolean): string {
  const base = "/media/weather";
  if (code === null) return `${base}/sunny.png`;
  if (code === 0) return isDay ? `${base}/sunny.png` : `${base}/moon.png`;
  if ([1, 2, 3].includes(code)) {
    return isDay ? `${base}/partly-cloudy.png` : `${base}/partly-cloudy-night.png`;
  }
  if ([45, 48].includes(code)) return `${base}/fog.png`;
  if ([51, 53, 55, 56, 57].includes(code)) return `${base}/drizzle.png`;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return `${base}/rain.png`;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return `${base}/snow.png`;
  if ([95, 96, 99].includes(code)) return `${base}/thunderstorm.png`;
  return `${base}/sunny.png`;
}

function WeatherIcon({ code, isDay }: { code: number | null; isDay: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span aria-hidden="true">{weatherEmoji(code, isDay)}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={weatherIconSrc(code, isDay)}
      alt=""
      aria-hidden="true"
      draggable={false}
      onError={() => setFailed(true)}
      // Was 18/18 with a -4px nudge — bumped to 24/24 (matches your
      // "barely noticeable" note on the hand-drawn art) and the vertical
      // nudge scaled up proportionally so it still sits centered against
      // the surrounding 18px header text. Tweak verticalAlign a px or two
      // if it reads slightly high/low once you see it live.
      style={{ width: 24, height: 24, verticalAlign: "-6px" }}
    />
  );
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
        fontSize: 14,
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
          // Was "space-between": across only 4-5 groups, that stretches
          // them to fill the ENTIRE row width on a wide monitor — the
          // big-gap look you flagged. That was always true of this
          // layout; it just never showed because html{zoom:75%} shrank
          // the whole page (gaps included) down to 75% scale, which
          // happened to land close to how the Figma reference looks. Now
          // that the zoom is gone, "flex-start" + a fixed gap keeps every
          // group close together regardless of window width — matching
          // image 3 — and marginLeft:"auto" below pins just the
          // date/weather block to the far right, the same way it reads
          // in that reference.
          justifyContent: "flex-start",
          // Matches <main>'s "0 3rem 3rem" side padding in page.tsx —
          // these two were out of sync (2rem here vs 3rem there), which is
          // why "Sara Del Villar" didn't line up with the intro paragraph
          // or the grid's left/right edges even though everything looked
          // individually centered.
          padding: "1.5rem 3rem",
          fontSize: 15,
          fontWeight: 500,
          // nowrap, not wrap: this header is designed as ONE row, always
          // (per the Figma reference) — it should never break into a
          // second line on desktop. "wrap" was the actual bug just now:
          // the 2.5rem gaps between the other 4 groups ate into the
          // leftover space the date/weather block needed to fit on line
          // one, so it silently wrapped to its own second line, and
          // marginLeft:"auto" then pushed that lone item to the right
          // edge of that (mostly empty) second line — which is why it
          // looked like it had jumped down near the portrait image. With
          // nowrap, marginLeft:"auto" on the date block still does its
          // job (flush right, everything else flush left) but the row
          // itself can never split, regardless of exact widths.
          flexWrap: "nowrap",
          gap: "2rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            <strong style={{ fontSize: 16, fontWeight: 700 }}>Sara Del Villar</strong>
          </Link>
          <RotatingSubtext />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              // Green reads as "open for work"; once CURRENT_EMPLOYER is
              // set, the dot switches to the brand blue instead, so the
              // indicator's color still matches what the text next to it
              // is actually saying rather than staying a job-search green
              // forever.
              background: CURRENT_EMPLOYER ? "var(--color-brand-blue)" : "#03C000",
              display: "inline-block",
            }}
          />
          <span>{now ? getAvailabilityLabel(now) : ""}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span>Services</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Product design</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Web design</span>
          <span style={{ color: "#777777", fontSize: 13, lineHeight: 1.5 }}>Interaction design</span>
        </div>

        {/* flex-start, not center: "center" was vertically centering
            Resume/Github/X within nav's own height — and nav's height is
            set by its TALLEST child, the Connect button, which is taller
            than a line of plain text because of its own vertical padding.
            So the plain-text links were sitting in the middle of a box
            that's taller than they are, which reads as "lower than it
            should be" compared to the flush-top text everywhere else in
            the header. flex-start pins every child's top edge to nav's
            top edge instead, matching the rest of the row. */}
        <nav style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", color: "inherit" }}>
          <a href="/resume.pdf" style={{ color: "inherit" }}>
            Resume
          </a>
          <Button href="mailto:sedelvillar104@gmail.com" fontSize={14}>
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
          // No marginLeft:"auto" here on purpose — that fills ALL leftover
          // row width, which is small on a Figma-canvas-sized frame but
          // huge on an actual wide monitor (that was the "too much space
          // between X and Mon" gap). Letting this block flow right after
          // nav with the same fixed `gap` as every other group keeps it
          // consistently close, regardless of window width.
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {dateString} {timeString} EST - NYC
            {tempF !== null && (
              <>
                <WeatherIcon code={weatherCode} isDay={isDay} />
                {tempF}°F
              </>
            )}
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
