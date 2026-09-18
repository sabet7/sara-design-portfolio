"use client";

import { useEffect, useState } from "react";
import styles from "./Preloader.module.css";

interface PreloaderProps {
  /** Your Sol LeWitt-inspired loading animation. Same animated-WebP-via-
   *  <img> pattern as the rest of the site's animations (keeps alpha
   *  transparency, which <video> would strip). Leave unset and it uses
   *  DEFAULT_SRC below — drop your file at that exact path and it picks
   *  it up automatically, no code change needed. Until that file exists,
   *  a plain pulsing square stands in so the preloader still works
   *  end to end. */
  src?: string;
  /** Minimum time the preloader stays up, in ms, even if the page is
   *  already loaded — long enough for the animation to actually be
   *  seen once, not flash by. Tune this once you see the real
   *  animation's length. */
  minDurationMs?: number;
}

const DEFAULT_SRC = "/media/preloader/sol-lewitt.webp";
const DEFAULT_MIN_DURATION = 1400;
const FADE_MS = 500;

export default function Preloader({
  src,
  minDurationMs = DEFAULT_MIN_DURATION,
}: PreloaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [assetFailed, setAssetFailed] = useState(false);

  useEffect(() => {
    const start = Date.now();

    function finish() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(minDurationMs - elapsed, 0);
      window.setTimeout(() => {
        setFading(true);
        // Only unmount once the fade has actually finished playing.
        window.setTimeout(() => setVisible(false), FADE_MS);
      }, remaining);
    }

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
      return () => window.removeEventListener("load", finish);
    }
  }, [minDurationMs]);

  if (!visible) return null;

  const resolvedSrc = src ?? DEFAULT_SRC;

  return (
    <div
      className={`${styles.preloader} ${fading ? styles.fadeOut : ""}`}
      aria-hidden="true"
    >
      {assetFailed ? (
        <div className={styles.placeholder} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt=""
          className={styles.animation}
          onError={() => setAssetFailed(true)}
        />
      )}
    </div>
  );
}
