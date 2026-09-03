'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import styles from './DoodleLayer.module.css';

const WEIGHTS = [2, 4, 7, 11];

interface Point {
  x: number;
  y: number;
  pressure: number;
}

export default function DoodleLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  // Buffers the last couple of raw pointer samples so each new segment is
  // drawn as a smooth curve through them, rather than a straight line to
  // the newest (often jagged) sample.
  const pointsRef = useRef<Point[]>([]);

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

  function getPoint(e: ReactPointerEvent<HTMLCanvasElement>): Point {
    return { x: e.clientX, y: e.clientY, pressure: e.pressure || 0.5 };
  }

  function midpoint(a: Point, b: Point) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active) return;
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    pointsRef.current = [getPoint(e)];
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active || !drawing.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const points = pointsRef.current;
    points.push(getPoint(e));

    // Need three samples to curve through the middle one — with fewer,
    // just wait for the next pointer-move event.
    if (points.length < 3) return;

    const [p0, p1, p2] = points.slice(-3);
    const start = midpoint(p0, p1);
    const end = midpoint(p1, p2);

    ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
    ctx.lineWidth = weight * Math.max(((p0.pressure + p1.pressure) / 2) * 1.6, 0.5);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(p1.x, p1.y, end.x, end.y);
    ctx.stroke();

    // Keep the last two points — the new segment continues from where
    // this one ended, so the curve stays unbroken.
    pointsRef.current = points.slice(-2);
  }

  function handlePointerUp() {
    const ctx = ctxRef.current;
    const points = pointsRef.current;

    if (ctx && points.length >= 2) {
      // Close out with a short plain segment to the final raw sample, so
      // the stroke doesn't stop just short of where the pointer actually
      // left off.
      const [p0, p1] = points.slice(-2);
      ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
      ctx.lineWidth = weight * Math.max(p1.pressure * 1.6, 0.5);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    } else if (ctx && points.length === 1) {
      // A tap with no drag — leave a small round dot (the round line cap
      // renders a zero-length stroke as a dot).
      const p = points[0];
      ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
      ctx.lineWidth = weight * Math.max(p.pressure * 1.6, 0.5);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    drawing.current = false;
    pointsRef.current = [];
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
          {active ? <CloseIcon /> : <BrushIcon />}
        </button>
      </div>
    </>
  );
}

function CloseIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
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
