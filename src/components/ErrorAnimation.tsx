"use client";

import { useState } from "react";

// The 404 page's animation. Save it as public/media/footer/error-page.webp.
// If the file isn't there yet, nothing is drawn (no broken-image icon).
const SRC = "/media/footer/error-page.webp";

export default function ErrorAnimation({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
