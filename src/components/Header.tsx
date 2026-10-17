"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
function getAvailabilityLabel(now: Date, short = false): string {
  if (CURRENT_EMPLOYER) return `Currently at ${CURRENT_EMPLOYER}`;
  const month = now.toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    timeZone: "America/New_York",
  });
  const year = now.toLocaleDateString("en-US", {
    year: "numeric",
    timeZone: "America/New_York",
  });
  return `Available ${month} ${year}`;
}

// Weather icons live in /public/media/weather/. Each condition lists the file
// names it will accept, in order (lowercase hyphenated names first, then
// other spellings), as .png or .webp. If a condition's own icon is missing,
// the next-closest icon is used (for example drizzle falls back to rain). If
// nothing loads, no icon is drawn and the tried paths are logged to the
// browser console.
const WEATHER_DIR = "/media/weather";
const WEATHER_EXTS = [".png", ".webp"];

const WEATHER_FILES: Record<string, string[]> = {
  sun: ["sunny", "New_Sun", "Sun", "sun", "Sunny", "new-sun"],
  moon: ["moon", "Moon"],
  partly: ["partly-cloudy", "Partly_Cloudy", "partly_cloudy", "PartlyCloudy"],
  partlyNight: ["partly-cloudy-night", "Partly_Cloudy_Night", "partly_cloudy_night"],
  cloudy: ["cloudy", "Cloudy", "Clouds", "clouds"],
  fog: ["fog", "Fog"],
  drizzle: ["drizzle", "Drizzle"],
  rain: ["rain", "Rain"],
  snow: ["snow", "Snow"],
  thunder: ["thunderstorm", "Thunderstorm", "thunder", "Thunder"],
};

// Files that live outside /media/weather/ (full paths, tried after the names
// above). The night icon reuses the dimmer's moon, so the two always match.
const WEATHER_EXTRA: Record<string, string[]> = {
  moon: [
    "/media/icons/dimmer_moon_static_icon.webp",
    "/media/icons/dimmer-moon.webp",
    "/media/icons/dimmer-moon.png",
  ],
};

// Ordered list of weather keys to try for a condition.
function weatherKeys(code: number | null, isDay: boolean): string[] {
  if (code === null || code === 0) return isDay ? ["sun"] : ["moon", "sun"];
  if (code === 1 || code === 2) {
    return isDay ? ["partly", "cloudy"] : ["partlyNight", "partly", "cloudy"];
  }
  if (code === 3) return ["cloudy", "partly"];
  if ([45, 48].includes(code)) return ["fog", "cloudy"];
  if ([51, 53, 55, 56, 57].includes(code)) return ["drizzle", "rain"];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["rain"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["snow", "cloudy"];
  if ([95, 96, 99].includes(code)) return ["thunder", "rain"];
  return isDay ? ["sun"] : ["moon", "sun"];
}

function weatherCandidates(code: number | null, isDay: boolean): string[] {
  const out: string[] = [];
  for (const key of weatherKeys(code, isDay)) {
    for (const name of WEATHER_FILES[key]) {
      for (const ext of WEATHER_EXTS) out.push(`${WEATHER_DIR}/${name}${ext}`);
    }
    for (const path of WEATHER_EXTRA[key] ?? []) out.push(path);
  }
  return out;
}

// Keyed by the condition so a failed load for one condition never carries
// over to the next. Nothing renders until the weather code is known.
function WeatherIcon({ code, isDay }: { code: number | null; isDay: boolean }) {
  if (code === null) return null;
  return (
    <WeatherIconImage
      key={`${code}-${isDay ? "d" : "n"}`}
      candidates={weatherCandidates(code, isDay)}
    />
  );
}

function WeatherIconImage({ candidates }: { candidates: string[] }) {
  const [index, setIndex] = useState(0);
  const exhausted = index >= candidates.length;

  useEffect(() => {
    if (exhausted) {
      console.warn("[header] No weather icon found. Tried:", candidates);
    }
  }, [exhausted, candidates]);

  if (exhausted) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[index]}
      alt=""
      aria-hidden="true"
      draggable={false}
      onError={() => setIndex((i) => i + 1)}
      // "weather-icon" inverts the icon at the dark dimmer stages (globals.css).
      className="weather-icon sdv-hdr-wicon"
    />
  );
}

// All header layout rules live HERE (not in globals.css) so the header can
// never depend on which copy of globals.css is loaded.
//
// How it stays responsive at every width: everything inside the header is
// sized in em, so the whole row scales with ONE number — the header's
// font-size. useLayoutEffect below measures how wide the row naturally is at
// a reference size, then sets the font-size that makes it exactly fit the
// window (real measurement, so it holds for any font and any content).
// Fit order, each step tried only if the previous would need a font under
// MIN_FONT_PX (11px):
//   1. full text on one line
//   2. compact text on one line ("Oct" instead of "October", no "EST - NYC")
//   3. tight spacing on one line (also drops the weekday, smaller button)
//   4. stacked rows (data-mode="stack"), still 11px or larger
// A phone is ~360px wide and 11px text gives ~32 characters-widths per line,
// while the header's content is ~70 wide, so phones always reach step 4.
const REF_FONT_PX = 16;
const MAX_FONT_PX = 16;
const MIN_FONT_PX = 11;

// At or below this width the header is just "SV" + Connect. Connect opens a
// small modal with Resume / Email / LinkedIn instead of linking straight to
// mailto:. Keep this in sync with the max-width in HEADER_CSS below.
const MOBILE_QUERY = "(max-width: 767px)";

const HEADER_CSS = `
.sdv-hdr {
  --sdv-gutter: clamp(1rem, 3vw, 3rem);
  box-sizing: border-box;
  width: 100%;
  padding: 0.9em var(--sdv-gutter);
  font-size: clamp(9px, 0.95vw, 16px);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* Mobile: the Services block is hidden to free up room. */
@media (max-width: 640px) {
  .sdv-hdr .sdv-hdr-services { display: none; }
}
.sdv-hdr[data-compact="0"] .sdv-short { display: none; }
.sdv-hdr:not([data-compact="0"]) .sdv-full { display: none; }
.sdv-hdr[data-compact="2"] .sdv-wk { display: none; }
.sdv-hdr[data-compact="2"] .sdv-hdr-items,
.sdv-hdr[data-compact="2"] .sdv-hdr-brand { gap: 0.8em; }
.sdv-hdr[data-compact="2"] .sdv-hdr-nav { gap: 0.7em; margin-top: -0.35em; }
.sdv-hdr[data-compact="2"] .sdv-hdr-nav a[href^="mailto:"] { padding: 0.35em 0.9em !important; }
.sdv-hdr-items {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5em;
  width: 100%;
}
.sdv-hdr-brand {
  display: flex;
  align-items: center;
  gap: 1.5em;
}
.sdv-hdr-name { font-weight: 700; }
.sdv-name-sv { display: none; }
.sdv-connect-desktop { display: contents; }
.sdv-connect-mobile {
  display: none;
  align-items: center;
  background: var(--color-brand-orange, #e8581c);
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  padding: 0.55em 1.3em;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}
.sdv-hdr-avail { display: flex; align-items: center; gap: 0.45em; }
.sdv-hdr-dot {
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  flex-shrink: 0;
}
.sdv-hdr-services { display: flex; flex-direction: column; }
.sdv-hdr-services-item { color: #777777; font-size: 0.87em; line-height: 1.4; }
.sdv-hdr-nav {
  display: flex;
  align-items: center;
  gap: 1em;
  /* Pulls the taller Connect button up so Resume/Github/LinkedIn sit on the
     same line as "Services" and the name. */
  margin-top: -0.55em;
}
.sdv-hdr-nav a { color: inherit; text-decoration: none; }
.sdv-hdr-nav a[href^="mailto:"] {
  font-size: 1em !important;
  padding: 0.55em 1.3em !important;
  gap: 0.4em !important;
  color: #ffffff;
}
.sdv-hdr-datetime {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
}
.sdv-hdr-wicon {
  width: 1.9em;
  height: 1.9em;
  margin: -0.35em 0;
  flex-shrink: 0;
}

/* Stacked layout — only used when one line can't fit at 11px or larger.
   Each group is its own row: brand, nav, then services + date/time. */
.sdv-hdr[data-mode="stack"] { font-size: clamp(11px, 3.3vw, 14px); }
.sdv-hdr[data-mode="stack"] .sdv-hdr-items {
  flex-wrap: wrap;
  row-gap: 0.8em;
  column-gap: 1em;
}
.sdv-hdr[data-mode="stack"] .sdv-hdr-brand {
  order: 1;
  flex: 1 1 100%;
  justify-content: space-between;
  gap: 1em;
}
.sdv-hdr[data-mode="stack"] .sdv-hdr-nav {
  order: 2;
  flex: 1 1 100%;
  justify-content: space-between;
  margin-top: 0;
}
.sdv-hdr[data-mode="stack"] .sdv-hdr-services { order: 3; }
.sdv-hdr[data-mode="stack"] .sdv-hdr-datetime { order: 4; }

/* Mobile: only "SV" and the Connect button, always on one line. */
@media (max-width: 767px) {
  .sdv-hdr { font-size: clamp(14px, 4vw, 16px) !important; }
  .sdv-hdr .sdv-hdr-items { align-items: center; flex-wrap: nowrap; }
  .sdv-hdr .sdv-hdr-avail,
  .sdv-hdr .sdv-hdr-services,
  .sdv-hdr .sdv-hdr-datetime,
  .sdv-hdr .sdv-hdr-nav-link,
  .sdv-hdr .sdv-name-full,
  .sdv-hdr .sdv-connect-desktop { display: none; }
  .sdv-hdr .sdv-name-sv { display: inline; }
  .sdv-hdr .sdv-connect-mobile { display: inline-flex; }
  .sdv-hdr .sdv-hdr-nav { margin-top: 0; }
}

/* Connect modal (mobile). */
@keyframes sdvConnectFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sdvConnectRise {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.sdv-connect-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9600;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: sdvConnectFade 0.2s ease;
}
.sdv-connect-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 340px;
  background: #ffffff;
  color: var(--color-text);
  border-radius: 24px;
  padding: 2.75rem 1.75rem 1.75rem;
  animation: sdvConnectRise 0.25s ease;
}
.sdv-connect-close {
  position: absolute;
  top: 10px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
}
.sdv-connect-links {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 18px;
  font-weight: 500;
}
.sdv-connect-links a { color: inherit; text-decoration: none; }
.sdv-connect-email {
  display: block;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  background: var(--color-brand-orange, #e8581c);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  padding: 1rem;
  border-radius: 999px;
  text-decoration: none;
}
`;

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const [tempF, setTempF] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [isDay, setIsDay] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef<HTMLDivElement | null>(null);

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


  useEffect(() => setMounted(true), []);

  // Connect modal: Escape closes it, and the page behind it doesn't scroll.
  useEffect(() => {
    if (!connectOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConnectOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [connectOpen]);

  // Fits the header to the window. Runs before paint, so there is no flash
  // of an unfitted header.
  const fitKey = `${now ? 1 : 0}|${tempF}|${weatherCode}`;
  useLayoutEffect(() => {
    const header = headerRef.current;
    const items = itemsRef.current;
    if (!header || !items) return;

    function fit() {
      if (!header || !items) return;

      // Mobile is "SV" + Connect — always fits, no measuring needed.
      if (window.matchMedia(MOBILE_QUERY).matches) {
        header.setAttribute("data-mode", "mobile");
        header.setAttribute("data-compact", "0");
        header.style.fontSize = "";
        return;
      }

      const cs = getComputedStyle(header);
      const available =
        header.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);

      // Natural single-line width at the reference size, for either the
      // full text ("0"), compact text ("1") or tight spacing ("2"). Returns the font size
      // that would make that version fill the available width exactly.
      function fittedSize(compact: "0" | "1" | "2"): number {
        if (!header || !items) return 0;
        header.setAttribute("data-mode", "line");
        header.setAttribute("data-compact", compact);
        header.style.fontSize = `${REF_FONT_PX}px`;
        items.style.width = "max-content";
        const natural = items.getBoundingClientRect().width;
        items.style.width = "";
        if (natural <= 0 || available <= 0) return 0;
        return Math.floor(((REF_FONT_PX * available) / natural) * 4) / 4 - 0.25;
      }

      let size = fittedSize("0");
      if (size < MIN_FONT_PX) size = fittedSize("1");
      if (size < MIN_FONT_PX) size = fittedSize("2");

      if (size >= MIN_FONT_PX) {
        header.style.fontSize = `${Math.min(MAX_FONT_PX, size)}px`;
      } else {
        header.setAttribute("data-mode", "stack");
        header.setAttribute("data-compact", "1");
        header.style.fontSize = "";
      }
    }

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(header);
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [fitKey]);

  const timeString = now
    ? now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const weekdayString = now
    ? now.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
      })
    : "";
  const monthDayString = now
    ? now.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <>
      <style>{HEADER_CSS}</style>
      <header className="sdv-hdr" ref={headerRef} data-mode="line" data-compact="0">
        <div className="sdv-hdr-items" ref={itemsRef}>
          <div className="sdv-hdr-brand">
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              <strong className="sdv-hdr-name">
                <span className="sdv-name-full">Sara Del Villar</span>
                <span className="sdv-name-sv">SV</span>
              </strong>
            </Link>

            <div className="sdv-hdr-avail">
              <span
                className="sdv-hdr-dot"
                style={{
                  // Green reads as "open for work"; switches to the brand
                  // blue once CURRENT_EMPLOYER is set.
                  background: CURRENT_EMPLOYER ? "var(--color-brand-blue)" : "#03C000",
                }}
              />
              <span className="sdv-full">{now ? getAvailabilityLabel(now) : ""}</span>
              <span className="sdv-short">{now ? getAvailabilityLabel(now, true) : ""}</span>
            </div>
          </div>

          <div className="sdv-hdr-services">
            <span>Services</span>
            <span className="sdv-hdr-services-item">Product design</span>
            <span className="sdv-hdr-services-item">Web design</span>
            <span className="sdv-hdr-services-item">Interaction design</span>
          </div>

          <nav className="sdv-hdr-nav">
            <a href="/resume.pdf" className="sdv-hdr-nav-link">
              Resume
            </a>
            {/* Desktop/tablet: the normal mailto: button. */}
            <span className="sdv-connect-desktop">
              <Button href="mailto:sedelvillar104@gmail.com" fontSize={14}>
                Connect
              </Button>
            </span>
            {/* Mobile: opens the modal below instead. */}
            <button
              type="button"
              className="sdv-connect-mobile"
              onClick={() => setConnectOpen(true)}
              aria-haspopup="dialog"
            >
              Connect
            </button>
            <a
              href="https://github.com/sabet7"
              target="_blank"
              rel="noreferrer"
              className="sdv-hdr-nav-link"
            >
              Github
            </a>
            <a
              href="https://www.linkedin.com/in/saradelvillar/"
              target="_blank"
              rel="noreferrer"
              className="sdv-hdr-nav-link"
            >
              LinkedIn
            </a>
          </nav>

          {now && (
            <span className="sdv-hdr-datetime">
              <span>
                <span className="sdv-wk">{weekdayString}{", "}</span>
                {monthDayString} {timeString}
                <span className="sdv-full">{" EST - NYC"}</span>
              </span>
              {tempF !== null && (
                <>
                  <WeatherIcon code={weatherCode} isDay={isDay} />
                  {tempF}°F
                </>
              )}
            </span>
          )}
        </div>
      </header>

      {mounted &&
        connectOpen &&
        createPortal(
          <div
            className="sdv-connect-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Connect"
            onClick={() => setConnectOpen(false)}
          >
            <div className="sdv-connect-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="sdv-connect-close"
                aria-label="Close"
                onClick={() => setConnectOpen(false)}
              >
                ×
              </button>
              <div className="sdv-connect-links">
                <a href="/resume.pdf" target="_blank" rel="noreferrer">
                  Resume
                </a>
                <a
                  href="https://www.linkedin.com/in/saradelvillar/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </div>
              <a className="sdv-connect-email" href="mailto:sedelvillar104@gmail.com">
                Email
              </a>
            </div>
          </div>,
          document.body
        )}

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
