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
      // "weather-icon": hooks into globals.css to invert this icon to
      // white at the charcoal/near-black dimmer stages (unchanged).
      // "header-weather-icon": the NEW class carrying this icon's
      // width/height/verticalAlign — moved out of inline style and into
      // globals.css so the 3 responsive breakpoints there can shrink it
      // alongside the rest of the header instead of it staying a fixed
      // 34px regardless of viewport.
      className="weather-icon header-weather-icon"
    />
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
      {/* All layout-affecting properties (padding, gap, font-size) live on
          .header-row and its children in globals.css, with @media
          overrides at 1024/640/480/375px. white-space: nowrap is set once
          on .header-row and inherited by every child span/link below,
          which is the fix for text wrapping onto multiple lines at a
          narrower width. header-name and header-availability-text no
          longer set their own font-size — both now inherit header-row's
          base size at every breakpoint, so every piece of header text
          (name, availability, nav links, date/time) renders at the same
          size; only header-services-item (the Product/Web/Interaction
          design list) keeps its own smaller, muted size. The rotating
          subtitle under the name is gone — this is just the name now. */}
      <header className="header-row">
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <strong className="header-name">Sara Del Villar</strong>
        </Link>

        <div className="header-availability">
          <span
            className="header-availability-dot"
            style={{
              // Green reads as "open for work"; once CURRENT_EMPLOYER is
              // set, the dot switches to the brand blue instead, so the
              // indicator's color still matches what the text next to it
              // is actually saying rather than staying a job-search green
              // forever.
              background: CURRENT_EMPLOYER ? "var(--color-brand-blue)" : "#03C000",
            }}
          />
          <span className="header-availability-text">{now ? getAvailabilityLabel(now) : ""}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span>Services</span>
          <span className="header-services-item">Product design</span>
          <span className="header-services-item">Web design</span>
          <span className="header-services-item">Interaction design</span>
        </div>

        {/* flex-start, not center: "center" was vertically centering
            Resume/Github within nav's own height — and nav's height is
            set by its TALLEST child, the Connect button, which is taller
            than a line of plain text because of its own vertical padding.
            So the plain-text links were sitting in the middle of a box
            that's taller than they are, which reads as "lower than it
            should be" compared to the flush-top text everywhere else in
            the header. flex-start pins every child's top edge to nav's
            top edge instead, matching the rest of the row. */}
        <nav className="header-nav">
          <a href="/resume.pdf" className="header-nav-link">
            Resume
          </a>
          <Button href="mailto:sedelvillar104@gmail.com" fontSize={14}>
            Connect
          </Button>
          <a
            href="https://github.com/sabet7"
            target="_blank"
            rel="noreferrer"
            className="header-nav-link"
          >
            Github
          </a>
          <a
            href="https://www.linkedin.com/in/saradelvillar/"
            target="_blank"
            rel="noreferrer"
            className="header-nav-link"
          >
            LinkedIn
          </a>
        </nav>

        {now && (
          <span className="header-datetime">
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
