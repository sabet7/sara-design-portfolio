"use client";

import { useEffect, useState } from "react";

// The year the site was built. It is only the starting value: as soon as the
// page loads in the visitor's browser, the year is replaced with the current
// year there, so it changes on January 1 with no deploy and no editing.
const BUILD_YEAR = new Date().getFullYear();

// Copyright line: year on the left, name on the right, lined up with the
// header's side margins. mt-auto pushes it to the bottom of short pages.
// pb-20 is the space under the text that keeps it clear of the floating nav
// and the pencil button; lower it (for example pb-8) for less space. Text
// color is inherited, so it follows the dimmer stages.
export default function Footer() {
  const [year, setYear] = useState(BUILD_YEAR);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-auto flex items-baseline justify-between px-[clamp(1rem,3vw,3rem)] pt-6 pb-20 text-xs opacity-60">
      <span>© {year}</span>
      <span>Sara Del Villar</span>
    </footer>
  );
}
