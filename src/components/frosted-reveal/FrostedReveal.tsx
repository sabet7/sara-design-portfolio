'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import styles from './FrostedReveal.module.css';

interface FrostedRevealProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** How wide the wipe circle is, in px. */
  wipeRadius?: number;
  /** If true, the frost fully reforms every time the pointer leaves. */
  resetOnLeave?: boolean;
}

export default function FrostedReveal({
  src,
  alt,
  width,
  height,
  wipeRadius = 70,
  resetOnLeave = true,
}: FrostedRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  const paintFrost = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // The "frost" is a soft translucent fill — the actual blur comes from
    // backdrop-filter on this canvas element, which is genuinely blurring
    // the sharp image sitting behind it. Where the canvas alpha drops to 0
    // (wiped), backdrop-filter contributes nothing and the sharp image
    // shows straight through.
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(245, 245, 246, 0.94)');
    gradient.addColorStop(1, 'rgba(245, 245, 246, 0.88)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    setReady(true);
  }, []);

  useEffect(() => {
    paintFrost();
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(paintFrost);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [paintFrost]);

  function wipeAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const wipeGradient = ctx.createRadialGradient(x, y, 0, x, y, wipeRadius);
    wipeGradient.addColorStop(0, 'rgba(0,0,0,1)');
    wipeGradient.addColorStop(0.7, 'rgba(0,0,0,0.9)');
    wipeGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wipeGradient;
    ctx.beginPath();
    ctx.arc(x, y, wipeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    wipeAt(e.clientX, e.clientY);
  }

  function handlePointerLeave() {
    if (resetOnLeave) paintFrost();
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Plain <img> keeps this a simple drop-in alongside the canvas overlay.
          Swap for next/image with `fill` if you'd rather have it optimized. */}
      <img src={src} alt={alt} className={styles.image} draggable={false} />
      <canvas
        ref={canvasRef}
        className={styles.frost}
        style={{
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          opacity: ready ? 1 : 0,
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
}
