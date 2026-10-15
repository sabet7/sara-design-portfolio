"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Shared shell for both intercepted routes (case studies + explorations).
// router.back() instead of a Link to "/" — this is what actually makes it
// feel like closing a window instead of navigating: it returns to exactly
// wherever the visitor was (scroll position, active Works/Fun filter)
// rather than hard-resetting to the homepage.
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function close() {
    router.back();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // .detail-modal-backdrop already exists in globals.css (built for
    // exactly this, just never wired into an actual route before) — its
    // own comment has the nav-clearance math worked out already.
    <div className="detail-modal-backdrop" onClick={close}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="detail-close" aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
