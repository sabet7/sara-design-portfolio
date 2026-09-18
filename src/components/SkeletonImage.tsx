"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import styles from "./SkeletonImage.module.css";

// How long a load is given before the skeleton shows at all. Short enough
// to actually cover a real network lag, long enough that a normal fast or
// cached load never flashes it — that's the "only appear when there's lag"
// behavior. Tune this one number if it feels off.
const SKELETON_DELAY_MS = 200;

/**
 * Drop-in replacement for next/image's <Image> that shows a shimmering
 * placeholder — but only if the image is actually slow to load (a bad
 * wifi connection, a big file). On a normal fast load, SKELETON_DELAY_MS
 * elapses before the skeleton would even appear, so it never flashes.
 * Requires a positioned parent when used with `fill`, same as <Image>
 * itself.
 */
export default function SkeletonImage(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  // A missing/broken image (404, bad path — common for placeholder/draft
  // projects that don't have a real thumbnail yet) never fires onLoad.
  // Without tracking that separately, the skeleton would shimmer forever
  // instead of only during an actual slow load — this is what stops that.
  const [failed, setFailed] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (loaded || failed) return;
    const timer = window.setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loaded, failed]);

  const settled = loaded || failed;

  return (
    <>
      {showSkeleton && !settled && <div className={styles.skeleton} aria-hidden="true" />}
      {!failed && (
        <Image
          {...props}
          onLoad={(event) => {
            setLoaded(true);
            props.onLoad?.(event);
          }}
          onError={(event) => {
            setFailed(true);
            props.onError?.(event);
          }}
          style={{
            ...props.style,
            opacity: loaded ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />
      )}
    </>
  );
}