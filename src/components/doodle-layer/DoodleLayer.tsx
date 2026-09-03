'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import styles from './DoodleLayer.module.css';

const WEIGHTS = [2, 4, 7, 11];

export default function DoodleLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [active, setActive] = useState(false);
  const [hue, setHue] = useState(18); // starts near studio-orange
  const [weight, setWeight] = useState(WEIGHTS[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const { innerWidth: w, innerHeight: h } = window;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      const ctx = canvas!.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  function getPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    return { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active) return;
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active || !drawing.current) return;
    const ctx = ctxRef.current;
    const last = lastPoint.current;
    if (!ctx || !last) return;

    const point = getPoint(e);
    ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
    ctx.lineWidth = weight * Math.max(point.pressure * 1.6, 0.5);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPoint.current = point;
  }

  function handlePointerUp() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ pointerEvents: active ? 'auto' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <div className={styles.dock}>
        {active && (
          <div className={styles.toolbar}>
            <div className={styles.hueTrack}>
              <input
                type="range"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className={styles.hueSlider}
                aria-label="Doodle color"
              />
              <div
                className={styles.hueThumb}
                style={{
                  left: `${(hue / 360) * 100}%`,
                  background: `hsl(${hue}, 85%, 55%)`,
                }}
              />
            </div>

            <div className={styles.weights}>
              {WEIGHTS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`${styles.weightButton} ${
                    weight === w ? styles.weightActive : ''
                  }`}
                  onClick={() => setWeight(w)}
                  aria-label={`Brush weight ${w}`}
                >
                  <SquiggleIcon strokeWidth={w * 0.6} />
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        )}

        <button
          type="button"
          className={`${styles.brushToggle} ${active ? styles.brushActive : ''}`}
          onClick={() => setActive((v) => !v)}
          aria-pressed={active}
          aria-label={active ? 'Turn off doodling' : 'Turn on doodling'}
        >
          <BrushIcon />
        </button>
      </div>
    </>
  );
}

function BrushIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.07" />
      <path d="M7.07 14.94c-1.66 1.66-2.34 5.32-2.34 5.32s3.66-.68 5.32-2.34a2.5 2.5 0 00-2.98-3.98z" />
    </svg>
  );
}

function SquiggleIcon({ strokeWidth }: { strokeWidth: number }) {
  return (
    <svg width={22} height={16} viewBox="0 0 32 20" fill="none">
      <path
        d="M2 14c3-8 6-8 9 0s6 8 9 0 6-8 9 0"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
