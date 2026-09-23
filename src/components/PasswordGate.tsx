"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PasswordGate.module.css";

interface PasswordGateProps {
  /** Unique key for this project — used for sessionStorage (unlock state
   *  and attempt count) so gating one project never affects another. Pass
   *  frontmatter.slug. */
  slug: string;
  /** Shown below the password field as a nudge, e.g. `it's not the app's
   *  name`. Comes from frontmatter.passwordHint — this one IS meant to be
   *  set per project, since the hint itself should differ. Omit it and
   *  none is shown. */
  hint?: string;
  /** Override for THIS project only — leave unset almost always. Every
   *  gated project shares one drawn frame by default (DEFAULT_FRAME_IMAGE
   *  below); only pass frontmatter.passwordFrameImage if some project
   *  genuinely needs a different one. */
  frameImageSrc?: string;
  /** Override for THIS project only — same deal as frameImageSrc. Every
   *  gated project shares one keyhole animation by default
   *  (DEFAULT_ANIMATION below); only pass frontmatter.passwordAnimation
   *  for a project that needs something different. */
  animationSrc?: string;
  /** The gated content — revealed once the correct password is entered. */
  children: React.ReactNode;
}

// How many wrong guesses are allowed before the form locks for the rest of
// the session. Change this one number if 5 feels wrong once you've tried it.
const MAX_ATTEMPTS = 5;

// The shared assets every private project uses unless it passes its own
// frameImageSrc/animationSrc. Drop your hand-drawn rectangle and keyhole
// animation at these exact paths (public/media/password-gate/...) and
// every gated case study/exploration picks them up automatically — no
// frontmatter edits needed per project. Until the files actually exist
// there, the <img> onError handlers below fall back to the plain
// placeholder boxes, so nothing breaks in the meantime.
const DEFAULT_FRAME_IMAGE = "/media/password-gate/frame.png";
const DEFAULT_ANIMATION = "/media/password-gate/keyhole-animation.webp";

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
  const [frameFailed, setFrameFailed] = useState(false);
  const [animationFailed, setAnimationFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedFrame = frameImageSrc ?? DEFAULT_FRAME_IMAGE;
  const resolvedAnimation = animationSrc ?? DEFAULT_ANIMATION;

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

        <h2 className={styles.headline}>
          Would love for you to read what&rsquo;s here, but I can&rsquo;t let
          you unless you have the password
        </h2>

        <div
          className={styles.animation}
          style={animationFailed ? { background: "#d9d9d9" } : undefined}
        >
          {!animationFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedAnimation}
              alt=""
              aria-hidden="true"
              className={styles.animationImg}
              onError={() => setAnimationFailed(true)}
            />
          )}
        </div>

        <div
          className={styles.frame}
          style={frameFailed ? undefined : { backgroundImage: `url(${resolvedFrame})` }}
        >
          {/* Hidden probe image, not displayed — its only job is to fire
              onError when resolvedFrame 404s, so .frame can fall back to
              its plain bordered look via CSS instead of showing a broken
              background-image. */}
          {!frameFailed && (
            <img
              src={resolvedFrame}
              alt=""
              aria-hidden="true"
              style={{ display: "none" }}
              onError={() => setFrameFailed(true)}
            />
          )}
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

        {/* Moved here from just under homeLink at the top — it was
            corner-pinned there before (see .hint in PasswordGate.module.css)
            and read as floating outside the card, jumbled with whatever
            else was near the top or bottom of the viewport depending on
            scroll. Directly under the password field is where it's
            actually useful anyway. */}
        {hint && <p className={styles.hint}>Hint: {hint}</p>}

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
