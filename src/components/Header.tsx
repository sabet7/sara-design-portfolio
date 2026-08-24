"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "./Button";

const NYC_LAT = 40.7128;
const NYC_LON = -74.006;

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const [tempF, setTempF] = useState<number | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${NYC_LAT}&longitude=${NYC_LON}&current=temperature_2m&temperature_unit=fahrenheit`
    )
      .then((res) => res.json())
      .then((data) => setTempF(Math.round(data.current.temperature_2m)))
      .catch(() => setTempF(null));
  }, []);

  const timeString = now
    ? now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
        fontSize: 14,
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <strong>SV</strong>
        </Link>
        {now && (
          <span>
            {dateString} {timeString} EST - New York{" "}
            {tempF !== null ? `☀️ ${tempF}°F` : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}>
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

      <nav style={{ display: "flex", gap: "1.25rem", paddingTop: 2 }}>
        <a href="/resume.pdf">Resume</a>
        <a href="mailto:hello@saravillar.com">Connect</a>
        <a href="https://github.com/sabet7" target="_blank" rel="noreferrer">
          Github
        </a>
        <a href="https://x.com/" target="_blank" rel="noreferrer">
          X
        </a>
      </nav>

      <Button href="mailto:hello@saravillar.com">Connect</Button>
    </header>
  );
}
