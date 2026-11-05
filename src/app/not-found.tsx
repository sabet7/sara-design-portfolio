import type { Metadata } from "next";
import Link from "next/link";
import ErrorAnimation from "@/components/ErrorAnimation";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// Layout: text at the top left, then the animation running edge to edge
// across the page. To make the animation bigger or smaller, change the
// width of .sdv-404-art (120vw = a little wider than the screen, so the
// hill line runs off both sides).
const CSS = `
.sdv-404 {
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: clamp(2rem, 6vh, 4.5rem) clamp(1.5rem, 4vw, 4rem) 0;
  overflow-x: clip;
}
.sdv-404-code {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  opacity: 0.55;
  margin: 0 0 0.75rem;
}
.sdv-404-title {
  font-size: clamp(26px, 3vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 0.75rem;
}
.sdv-404-text {
  max-width: 460px;
  font-size: clamp(14px, 1.1vw, 18px);
  line-height: 1.5;
  opacity: 0.7;
  margin: 0 0 1.5rem;
}
.sdv-404-link {
  display: inline-flex;
  align-items: center;
  padding: 0.75em 1.8em;
  border-radius: 999px;
  background: var(--color-brand-orange, #f65009);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}
.sdv-404-art {
  align-self: center;
  width: 120vw;
  max-width: none;
  height: auto;
  display: block;
  margin-top: 1rem;
  pointer-events: none;
}
:root[data-dimmer-stage="charcoal"] .sdv-404-art,
:root[data-dimmer-stage="near-black"] .sdv-404-art {
  filter: invert(1);
}
`;

export default function NotFound() {
  return (
    <main className="sdv-404">
      <style>{CSS}</style>
      <p className="sdv-404-code">404</p>
      <h1 className="sdv-404-title">This page doesn&apos;t exist.</h1>
      <p className="sdv-404-text">
        The link may be broken, or the page may have moved.
      </p>
      <Link href="/" className="sdv-404-link">
        Back to home
      </Link>
      <ErrorAnimation className="sdv-404-art" />
    </main>
  );
}
