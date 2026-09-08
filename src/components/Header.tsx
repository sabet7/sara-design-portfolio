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
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "1.5rem 2rem",
        fontSize: 18,
        fontWeight: 500,
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <strong style={{ fontSize: 20, fontWeight: 800 }}>SV</strong>
        </Link>
        {now && (
          <span>
            {dateString} {timeString} EST - New York{" "}
            {tempF !== null ? `${weatherIcon(weatherCode, isDay)} ${tempF}°F` : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, paddingTop: 3 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
          }}
        />
        <span>Available September 2026</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span>Services</span>
        <span style={{ opacity: 0.75 }}>Product design</span>
        <span style={{ opacity: 0.75 }}>Web design</span>
        <span style={{ opacity: 0.75 }}>Interaction design</span>
      </div>

      <nav style={{ display: "flex", gap: "1.25rem", paddingTop: 2, color: "inherit" }}>
        <a href="/resume.pdf" style={{ color: "inherit" }}>
          Resume
        </a>
        <a href="mailto:sedelvillar104@gmail.com" style={{ color: "inherit" }}>
          Connect
        </a>
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

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button href="mailto:sedelvillar104@gmail.com" fontSize={20}>
          Connect
        </Button>
        <span
          style={{
            fontSize: 10,
            color: "#b3b3b3",
            fontWeight: 400,
          }}
        >
          v5
        </span>
      </div>
    </header>
  );
}
