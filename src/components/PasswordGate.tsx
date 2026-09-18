"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PasswordGate.module.css";

interface PasswordGateProps {
  /** Unique key for this project — used for sessionStorage (unlock state
   *  and attempt count) so gating one project never affects another. Pass
   *  frontmatter.slug. */
  slug: string;
  /** Shown top-right as a nudge, e.g. `it's not the app's name`. Comes from
   *  frontmatter.passwordHint — omit it there and none is shown. */
  hint?: string;
  /** Your hand-drawn rectangle that frames the password input, from
   *  frontmatter.passwordFrameImage. Falls back to a plain bordered box
   *  until you add one. */
  frameImageSrc?: string;
  /** Your keyhole animation, from frontmatter.passwordAnimation — same
   *  animated-WebP-via-<img> pattern as the rest of the site's animations
   *  (keeps alpha transparency, which <video> would strip). Falls back to
   *  a plain gray box until you add one. */
  animationSrc?: string;
  /** The gated content — revealed once the correct password is entered. */
  children: React.ReactNode;
}

// How many wrong guesses are allowed before the form locks for the rest of
// the session. Change this one number if 5 feels wrong once you've tried it.
const MAX_ATTEMPTS = 5;

// One shared password for every project flagged `private` in its
// frontmatter, rather than a password per project — simpler to manage for
// now, and easy to split into a per-slug map later if you ever want
// different passwords per project. Set in .env.local as
// NEXT_PUBLIC_CASE_STUDY_PASSWORD, and add the same variable in Vercel's
// dashboard (same pattern as the Elie API key). NEXT_PUBLIC_ vars ship in
// the client bundle, so — as discussed — this is a lightweight gate, not
// real access control: fine for keeping a portfolio piece off search
// engines and casual visitors, not for anything that actually needs to
// stay secret.
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_CASE_STUDY_PASSWORD ?? "";

type GateStatus = "idle" | "wrong" | "correct" | "locked";

export default function PasswordGate({
  slug,
  hint,
  frameImageSrc,
  animationSrc,
  children,
}: PasswordGateProps) {
  const unlockKey = `password-gate-unlocked-${slug}`;
  const attemptsKey = `password-gate-attempts-${slug}`;

  // `checked` guards against a flash of the gate before we've had a chance
  // to read sessionStorage on mount.
  const [checked, setChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<GateStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const alreadyUnlocked = sessionStorage.getItem(unlockKey) === "true";
    const priorAttempts = Number(sessionStorage.getItem(attemptsKey) ?? "0");
    setUnlocked(alreadyUnlocked);
    setAttempts(priorAttempts);
    if (!alreadyUnlocked && priorAttempts >= MAX_ATTEMPTS) setStatus("locked");
    setChecked(true);
  }, [unlockKey, attemptsKey]);

  function handleSubmit() {
    if (status === "locked" || status === "correct") return;

    if (value.length > 0 && value === CORRECT_PASSWORD) {
      sessionStorage.setItem(unlockKey, "true");
      setStatus("correct");
      // Short pause so "Congrats! You've been chosen." is actually read
      // before the content underneath comes into focus.
      window.setTimeout(() => setUnlocked(true), 1200);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    sessionStorage.setItem(attemptsKey, String(nextAttempts));
    setValue("");
    inputRef.current?.focus();
    setStatus(nextAttempts >= MAX_ATTEMPTS ? "locked" : "wrong");
  }

  if (!checked) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className={styles.gate}>
      {/* The real content, blurred behind the gate. `inert` (a real HTML
          attribute, not just ARIA) drops it from tab order and screen
          readers in one shot — aria-hidden alone would still let a
          keyboard user tab into it. */}
      <div className={styles.gateBackdrop} aria-hidden="true" {...({ inert: "" } as Record<string, string>)}>
        {children}
      </div>
      <div className={styles.gateScrim} aria-hidden="true" />

      <div className={styles.gateContent}>
        <a href="/" className={styles.homeLink}>
          Made a wrong turn, take me back to home
        </a>

        {hint && <p className={styles.hint}>Hint: {hint}</p>}

        <h2 className={styles.headline}>
          Would love for you to read what&rsquo;s here, but I can&rsquo;t let
          you unless you have the password
        </h2>

        <div
          className={styles.animation}
          style={animationSrc ? undefined : { background: "#d9d9d9" }}
        >
          {animationSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={animationSrc}
              alt=""
              aria-hidden="true"
              className={styles.animationImg}
            />
          )}
        </div>

        <div
          className={styles.frame}
          style={frameImageSrc ? { backgroundImage: `url(${frameImageSrc})` } : undefined}
        >
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status === "wrong") setStatus("idle");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            disabled={status === "locked" || status === "correct"}
            placeholder="Password"
            aria-label="Password"
            className={styles.input}
          />
        </div>

        <p className={styles.message}>
          {status === "wrong" && "That’s not the correct password."}
          {status === "correct" && "Congrats! You’ve been chosen."}
          {status === "locked" &&
            "That's the last attempt for this session — refresh in a while to try again."}
        </p>
      </div>
    </div>
  );
}
