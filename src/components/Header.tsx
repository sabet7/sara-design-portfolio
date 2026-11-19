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
    month : "short",
   // month: short ? "short" : "long",
    timeZone: "America/New_York",
  });
  const year = now.toLocaleDateString("en-US", {
    year: "numeric",
    timeZone: "America/New_York",
  });
  return `Available to start ${month} ${year}`;
}

// Time-aware greeting, based on the hour in New York (same zone as the clock
// on the right). Each entry is [first hour it applies, text]; the last entry
// whose hour is <= the current hour wins. Edit the words or the hours here.
const GREETINGS: [number, string][] = [
  [0, "Hello"],
  [5, "Good morning"],
  [12, "Good afternoon"],
  [17, "Good evening"],
  [22, "Hello"],
];

function getGreeting(now: Date): string {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/New_York",
    }).format(now),
    10
  );
  let text = GREETINGS[0][1];
  for (const [from, label] of GREETINGS) {
    if (hour >= from) text = label;
  }
  return text;
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

// Resume, LinkedIn and GitHub. On desktop (a screen 768px or wider that has a
// mouse) each one is shown as its hand-drawn icon, and its name appears in a
// small black label under the icon on hover or keyboard focus. On phones and on
// touch screens without hover, the full name is shown as text instead. If an
// icon file is missing, the text is shown too, so a link never disappears.
// Icons live in /public/media/icons/: document.png, linkedin.png, github.png.
function NavIconLink({
  href,
  label,
  icon,
  external,
  className,
}: {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`sdv-hdr-nav-link sdv-icon-link${failed ? " sdv-icon-failed" : ""}${className ? ` ${className}` : ""}`}
      aria-label={label}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="sdv-nav-icon"
          onError={() => setFailed(true)}
        />
      )}
      <span className="sdv-nav-text">{label}</span>
      <span className="sdv-tip" aria-hidden="true">
        {label}
      </span>
    </a>
  );
}

// The message that fades in one letter at a time, as if it were being said.
// Words are kept together so a line never breaks in the middle of a word. The
// animated copy is hidden from screen readers, which get the plain sentence.
function SpokenText({ text }: { text: string }) {
  let index = 0;
  const words = text.split(" ");
  // A space counts as one step of the timing, like a letter.
  const spaceAfter = () => {
    index++;
    return " ";
  };
  return (
    <p className="sdv-vm-text">
      <span className="sdv-vm-sr">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            <span className="sdv-vm-word">
              {Array.from(word).map((ch, c) => (
                <span
                  key={c}
                  className="sdv-vm-ch"
                  style={{ animationDelay: `${VM_START_MS + index++ * VM_CHAR_MS}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
            {w < words.length - 1 && spaceAfter()}
          </span>
        ))}
      </span>
    </p>
  );
}

// Mobile and tablet "Connect" card, styled as a voicemail box. There is no
// server behind the form: Leave message opens the visitor's email app with
// everything filled in.
function VoicemailCard({ onClose }: { onClose: () => void }) {
  const [phoneFailed, setPhoneFailed] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Message from ${name.trim()}`;
    const body = `${message.trim()}\n\nName: ${name.trim()}\nContact: ${contact.trim()}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div
      className="sdv-connect-card sdv-vm-card"
      style={
        {
          "--vm-beep": `${VM_BEEP_MS}ms`,
          "--vm-form": `${VM_FORM_MS}ms`,
        } as React.CSSProperties
      }
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="sdv-connect-close" aria-label="Close" onClick={onClose}>
        ×
      </button>

      {/* Hand-drawn landline phone. Drop the file at
          public/media/contact/landline-phone.webp (or change the path). If
          it is missing the space simply stays empty. */}
      {!phoneFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/media/contact/landline-phone.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="sdv-vm-phone"
          onError={() => setPhoneFailed(true)}
        />
      )}

      <SpokenText text={VOICEMAIL_MESSAGE} />

      <div className="sdv-vm-dots" aria-hidden="true">
        <span className="sdv-vm-dot" />
        <span className="sdv-vm-dot" />
        <span className="sdv-vm-dot" />
      </div>

      <form className="sdv-vm-form sdv-vm-reveal" onSubmit={handleSubmit}>
        <input
          className="sdv-vm-field"
          type="text"
          name="name"
          placeholder="Full name"
          aria-label="Full name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="sdv-vm-field sdv-vm-field-b"
          type="email"
          name="email"
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <textarea
          className="sdv-vm-field sdv-vm-field-c"
          name="message"
          rows={4}
          placeholder="Message"
          aria-label="Message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" className="sdv-vm-send">
          Leave message
        </button>
      </form>

      <p className="sdv-vm-foot sdv-vm-reveal">
        You can also reach out via{" "}
        <a href="https://www.linkedin.com/in/saradelvillar/" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </p>
    </div>
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
const MAX_FONT_PX = 14;
const MIN_FONT_PX = 11;

// At or below this width the header is just "SV" + Connect. Connect opens a
// small modal with Resume / Email / LinkedIn instead of linking straight to
// mailto:. Keep this in sync with the max-width in HEADER_CSS below.
const MOBILE_QUERY = "(max-width: 767px)";

// Mobile and tablet: at or below this width Connect opens the voicemail card
// instead of linking straight to mailto:. On phones the header is just
// "SV" + Resume icon + Connect (see MOBILE_QUERY); on tablets the header keeps
// its desktop layout but Connect still opens the card. Keep in sync with
// nothing else, this is only read in JavaScript below.
const MODAL_QUERY = "(max-width: 1024px)";

const CONTACT_EMAIL = "sedelvillar104@gmail.com";

// Voicemail card copy. Edit here.
const VOICEMAIL_MESSAGE =
  "This is Sara's inbox. I'm probably designing or working on other projects, but leave your name, contact info, and a reason for contacting me and I'll get back to you as soon as I can.";
// Timing of the card's animation, in ms. The message fades in one letter at a
// time (VM_CHAR_MS per letter), then the "beep" dots play, then the form
// fades in.
const VM_START_MS = 450;
const VM_CHAR_MS = 28;
const VM_BEEP_MS = VM_START_MS + VOICEMAIL_MESSAGE.length * VM_CHAR_MS + 250;
const VM_FORM_MS = VM_BEEP_MS + 800;

const HEADER_CSS = `
.sdv-hdr {
  --sdv-gutter: clamp(1rem, 3vw, 3rem);
  box-sizing: border-box;
  width: 100%;
  padding: 0.9em var(--sdv-gutter);
  font-size: clamp(9px, 0.82vw, 14px);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
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
.sdv-hdr-name { font-weight: 800; }
.sdv-greet { font-weight: 400; opacity: 0.55; }
.sdv-hdr:not([data-compact="0"]) .sdv-greet { display: none; }
.sdv-name-sv { display: none; }
.sdv-connect-desktop { display: contents; }
.sdv-connect-mobile {
  display: none;
  align-items: center;
  background: var(--color-brand-orange, #FF540A);
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
  animation: sdvDotPulse 1.6s ease-in-out infinite;
}
/* The dot swells slightly while a soft halo of its own colour spreads out
   and fades (the colour comes from the inline style, so it also follows the
   blue "Currently at" dot). */
@keyframes sdvDotPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 0%, transparent),
      0 0 0 0 color-mix(in srgb, currentColor 0%, transparent);
  }
  45% {
    transform: scale(1.08);
    box-shadow: 0 0 0 0.12em color-mix(in srgb, currentColor 14%, transparent),
      0 0 0.35em 0.05em color-mix(in srgb, currentColor 18%, transparent);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sdv-hdr-dot { animation: none; }
}
.sdv-hdr-nav {
  display: flex;
  align-items: center;
  gap: 1em;
  /* Pulls the taller Connect button up so Resume/Github/LinkedIn sit on the
     same line as the name. */
  margin-top: -0.55em;
}
.sdv-hdr-nav a { color: inherit; text-decoration: none; }
.sdv-hdr-nav a[href^="mailto:"] {
  font-size: 1em !important;
  padding: 0.55em 1.3em !important;
  gap: 0.4em !important;
  color: #ffffff;
}
/* Icon links (see NavIconLink). Text by default; icon + hover label on
   desktop with a mouse. */
.sdv-icon-link {
  --sdv-tip-bg: var(--color-black, #1F160F);
  --sdv-tip-fg: var(--color-cool-white, #FCFDFF);
  position: relative;
  display: inline-flex;
  align-items: center;
}
.sdv-icon-link .sdv-nav-icon,
.sdv-icon-link .sdv-tip { display: none; }
@media (min-width: 768px) and (hover: hover) {
  /* The text stays in the page for screen readers, just not visible. */
  .sdv-icon-link:not(.sdv-icon-failed) .sdv-nav-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  /* Icon size: change the two 1.9em values. */
  .sdv-icon-link:not(.sdv-icon-failed) .sdv-nav-icon {
    display: block;
    width: 1.9em;
    height: 1.9em;
    margin: -0.35em 0;
  }
  .sdv-icon-link:not(.sdv-icon-failed) .sdv-tip {
    display: block;
    position: absolute;
    top: calc(100% + 0.9em);
    left: 50%;
    transform: translateX(-50%) translateY(-0.25em);
    z-index: 40;
    padding: 0.5em 0.9em;
    border-radius: 0.7em;
    background: var(--sdv-tip-bg);
    color: var(--sdv-tip-fg);
    font-size: 1em;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .sdv-icon-link:not(.sdv-icon-failed) .sdv-tip::before {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-left: 0.6em solid transparent;
    border-right: 0.6em solid transparent;
    border-bottom: 0.7em solid var(--sdv-tip-bg);
  }
  .sdv-icon-link:hover .sdv-tip,
  .sdv-icon-link:focus-visible .sdv-tip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
/* The icons are black ink, so they are inverted on the dark dimmer stages
   (same as the weather icon), and the label flips to white with black text. */
:root[data-dimmer-stage="charcoal"] .sdv-nav-icon,
:root[data-dimmer-stage="near-black"] .sdv-nav-icon { filter: invert(1); }
:root[data-dimmer-stage="charcoal"] .sdv-icon-link,
:root[data-dimmer-stage="near-black"] .sdv-icon-link {
  --sdv-tip-bg: var(--color-cool-white, #FCFDFF);
  --sdv-tip-fg: var(--color-black, #1F160F);
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
   Each group is its own row: brand, nav, then date/time. */
.sdv-hdr[data-mode="stack"] { font-size: clamp(11px, 3vw, 13px); }
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
.sdv-hdr[data-mode="stack"] .sdv-hdr-datetime { order: 3; }

/* Mobile: only "SV" and the Connect button, always on one line. */
@media (max-width: 767px) {
  .sdv-hdr { font-size: clamp(13px, 3.6vw, 15px) !important; }
  .sdv-hdr .sdv-hdr-items { align-items: center; flex-wrap: nowrap; }
  .sdv-hdr .sdv-greet,
  .sdv-hdr .sdv-hdr-avail,
  .sdv-hdr .sdv-hdr-datetime,
  .sdv-hdr .sdv-hdr-nav-link,
  .sdv-hdr .sdv-name-full,
  .sdv-hdr .sdv-connect-desktop { display: none; }
  .sdv-hdr .sdv-name-sv { display: inline; }
  .sdv-hdr .sdv-connect-mobile { display: inline-flex; }
  .sdv-hdr .sdv-hdr-nav { margin-top: 0; }
  /* The Resume icon stays visible on mobile, to the left of Connect. The
     rest of the nav links stay hidden. Without the icon file, the word
     "Resume" is shown instead. */
  .sdv-hdr .sdv-hdr-nav .sdv-resume-link {
    display: inline-flex;
    order: -1;
    padding: 0.3em;
  }
  .sdv-hdr .sdv-hdr-nav .sdv-resume-link:not(.sdv-icon-failed) .sdv-nav-icon {
    display: block;
    width: 2.4em;
    height: 2.4em;
    margin: 0;
  }
  .sdv-hdr .sdv-hdr-nav .sdv-resume-link:not(.sdv-icon-failed) .sdv-nav-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
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
  max-width: 400px;
  max-height: calc(100dvh - 3rem);
  overflow-y: auto;
  background: #ffffff;
  color: var(--color-text);
  border-radius: 24px;
  padding: 2.75rem 1.75rem 1.75rem;
  animation: sdvConnectRise 0.3s ease;
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

/* Voicemail card. The order of events (timings are set in Header.tsx):
   the phone fades in, the message fades in one letter at a time, the "beep"
   dots play, then the form and the LinkedIn line fade in. */
@keyframes sdvVmFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes sdvVmBeep {
  0% { opacity: 0; transform: scale(0.5); }
  45% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes sdvVmReveal {
  from { opacity: 0; visibility: hidden; transform: translateY(6px); }
  to { opacity: 1; visibility: visible; transform: translateY(0); }
}
.sdv-vm-phone {
  display: block;
  width: auto;
  height: auto;
  max-width: 45%;
  max-height: 150px;
  margin: 0 auto 1.25rem;
  animation: sdvVmFade 0.5s ease 0.15s both;
}
.sdv-vm-text {
  margin: 0 0 1.25rem;
  font-size: 15px;
  line-height: 1.45;
}
.sdv-vm-word { display: inline-block; }
.sdv-vm-ch {
  opacity: 0;
  animation: sdvVmFade 0.5s ease-out forwards;
}
.sdv-vm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.sdv-vm-dots {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin: 0 0 1.5rem;
}
.sdv-vm-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-brand-orange, #FF540A);
  opacity: 0;
  animation: sdvVmBeep 0.45s ease-out both;
  animation-delay: var(--vm-beep, 0ms);
}
.sdv-vm-dot:nth-child(2) { animation-delay: calc(var(--vm-beep, 0ms) + 160ms); }
.sdv-vm-dot:nth-child(3) { animation-delay: calc(var(--vm-beep, 0ms) + 320ms); }
.sdv-vm-reveal {
  animation: sdvVmReveal 0.6s ease both;
  animation-delay: var(--vm-form, 0ms);
}
.sdv-vm-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
/* Hand-drawn boxes: a slightly different, uneven corner on every box, so the
   outlines read as drawn rather than machine-straight. To use real
   hand-drawn outlines instead, the border can be swapped for an SVG
   background. */
.sdv-vm-field {
  box-sizing: border-box;
  width: 100%;
  font: inherit;
  /* 16px or larger keeps iPhones from zooming in when a field is tapped. */
  font-size: 16px;
  line-height: 1.3;
  color: var(--color-text);
  background: #ffffff;
  border: 1.5px solid var(--color-text, #1F160F);
  border-radius: 14px 18px 12px 17px / 17px 12px 18px 13px;
  padding: 0.7em 0.9em;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.sdv-vm-field-b { border-radius: 17px 12px 18px 13px / 13px 18px 12px 16px; }
.sdv-vm-field-c {
  border-radius: 16px 13px 18px 14px / 13px 17px 14px 18px;
  resize: none;
}
.sdv-vm-field::placeholder { color: var(--color-text-muted, #4a4a4a); opacity: 0.7; }
.sdv-vm-field:focus { border-color: var(--color-brand-orange, #FF540A); }
.sdv-vm-send {
  align-self: stretch;
  background: var(--color-brand-orange, #FF540A);
  color: #ffffff;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  padding: 0.85em 1em;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}
.sdv-vm-foot {
  margin: 1.5rem 0 0;
  font-size: 12px;
  color: var(--color-text-muted, #4a4a4a);
}
.sdv-vm-foot a { color: inherit; text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  .sdv-connect-card, .sdv-connect-backdrop { animation: none; }
  .sdv-vm-phone, .sdv-vm-ch, .sdv-vm-dot, .sdv-vm-reveal {
    animation: none;
    opacity: 1;
    visibility: visible;
    transform: none;
  }
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
    const mq = window.matchMedia(MODAL_QUERY);
    function onResize() {
      if (!mq.matches) setConnectOpen(false);
    }
    mq.addEventListener("change", onResize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onResize);
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

  const dotColor = CURRENT_EMPLOYER ? "var(--color-brand-blue)" : "#03C000";

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
                  background: dotColor,
                  color: dotColor,
                }}
              />
              <span className="sdv-full">{now ? getAvailabilityLabel(now) : ""}</span>
              <span className="sdv-short">{now ? getAvailabilityLabel(now, true) : ""}</span>
            </div>
          </div>

          <nav className="sdv-hdr-nav">
            {/* Order: Connect, Resume, LinkedIn, Github. */}
            {/* Desktop/tablet: the normal mailto: button. */}
            <span
              className="sdv-connect-desktop"
              onClickCapture={(e) => {
                // Tablet: same button as desktop, but it opens the voicemail
                // card instead of the mail app.
                if (window.matchMedia(MODAL_QUERY).matches) {
                  e.preventDefault();
                  setConnectOpen(true);
                }
              }}
            >
              <Button href="mailto:sedelvillar104@gmail.com" fontSize={13}>
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
            <NavIconLink
              href="/resume.pdf"
              label="Resume"
              icon="/media/icons/document.png"
              className="sdv-resume-link"
            />
            <NavIconLink
              href="https://www.linkedin.com/in/saradelvillar/"
              label="LinkedIn"
              icon="/media/icons/linkedin.png"
              external
            />
            <NavIconLink
              href="https://github.com/sabet7"
              label="GitHub"
              icon="/media/icons/github.png"
              external
            />
          </nav>

          {now && (
            <span className="sdv-hdr-datetime">
              <span className="sdv-greet">{getGreeting(now)} ·</span>
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
            <VoicemailCard onClose={() => setConnectOpen(false)} />
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
