"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function ModalBackdrop({ children }: { children: ReactNode }) {
  const router = useRouter();

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) router.back();
  }

  return (
    <div className="detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="detail-card">
        <button onClick={() => router.back()} className="detail-close" aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
