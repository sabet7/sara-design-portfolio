'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import styles from './DoodleLayer.module.css';

// ---------------------------------------------------------------------------
// Doodle layer: a color slider, the brush list (marker only for now), and a per-brush weight
// slider that opens when you tap a brush. Styles live in
// DoodleLayer.module.css; markup and the brush engine live in this file.
//
// These are canvas-code brushes, not Procreate brushes (those are a closed
// file format nothing outside the app can read).
// ---------------------------------------------------------------------------

// Your hand-drawn icons for the toggle button, one per state. Until a file
// exists at the path below, the line-drawn SVG for that state is used.
const BRUSH_ICON_SRC = '/media/doodle/doodle-brush.png';
const CLOSE_ICON_SRC = '/media/doodle/doodle-close.png';

type BrushId = 'pen' | 'pencil' | 'pastel' | 'marker' | 'paint' | 'charcoal';

interface BrushDef {
  id: BrushId;
  label: string;
  /** Weight range (px) for the weight slider. */
  minWeight: number;
  maxWeight: number;
  defaultWeight: number;
  /** Opacity of the whole stroke, applied once to the finished stroke so
   *  overlapping stamps inside one stroke never build up darker patches. */
  opacity: number;
  /** [light touch, full pressure] width multipliers. */
  pressure: [number, number];
  /** Weight used for the 20px icon preview. */
  previewWeight: number;
}

// Order here is the order in the dock.
const ALL_BRUSHES: BrushDef[] = [
  {
    id: 'pen',
    label: 'Pen',
    minWeight: 1,
    maxWeight: 8,
    defaultWeight: 2.5,
    opacity: 1,
    pressure: [0.55, 1.25],
    previewWeight: 1.5,
  },
  {
    id: 'pencil',
    label: 'Pencil',
    minWeight: 1.5,
    maxWeight: 10,
    defaultWeight: 3.5,
    opacity: 1,
    pressure: [0.5, 1.4],
    previewWeight: 2.4,
  },
  {
    id: 'pastel',
    label: 'Oil pastel',
    minWeight: 6,
    maxWeight: 40,
    defaultWeight: 16,
    opacity: 1,
    pressure: [0.7, 1.15],
    previewWeight: 3.1,
  },
  {
    id: 'marker',
    label: 'Marker',
    minWeight: 6,
    maxWeight: 36,
    defaultWeight: 14,
    opacity: 0.86,
    pressure: [0.92, 1.05],
    previewWeight: 4,
  },
  {
    id: 'paint',
    label: 'Paint',
    minWeight: 8,
    maxWeight: 44,
    defaultWeight: 20,
    opacity: 1,
    pressure: [0.6, 1.2],
    previewWeight: 4.2,
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    minWeight: 4,
    maxWeight: 40,
    defaultWeight: 14,
    opacity: 1,
    pressure: [0.5, 1.3],
    previewWeight: 4.2,
  },
];

// Which brushes appear in the dock. Only the marker is on for now; the other
// brush definitions and their drawing code stay in this file, unused. To add
// a brush later, add its id here, e.g. ['marker', 'pencil'].
const ENABLED_BRUSHES: BrushId[] = ['marker'];
const BRUSHES = ALL_BRUSHES.filter((b) => ENABLED_BRUSHES.includes(b.id));

const BRUSH_BY_ID = Object.fromEntries(ALL_BRUSHES.map((b) => [b.id, b])) as Record<
  BrushId,
  BrushDef
>;

// Colors run red (top) -> magenta (bottom) over hue 0..HUE_MAX.
const HUE_MAX = 340;
const HUE_STOPS = [0, 30, 60, 120, 180, 240, 285, 340];
const HUE_GRADIENT = `linear-gradient(to bottom, ${HUE_STOPS.map(
  (h) => `hsl(${h}, 96%, 50%) ${((h / HUE_MAX) * 100).toFixed(1)}%`
).join(', ')})`;

// A touch that lands this soon after a pen event is treated as a resting
// palm and ignored (iPad + Apple Pencil).
const PALM_REJECT_MS = 2500;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Brush engine
// ---------------------------------------------------------------------------

interface Ink {
  hue: number;
  /** Single dark color, used for the icon previews. */
  mono: boolean;
}

const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

/** Color shown on the hue slider's thumb. */
const thumbColor = (hue: number) => hsl(hue, 96, 50);

function inkColor(brush: BrushId, ink: Ink, lightnessJitter = 0): string {
  if (ink.mono) return hsl(0, 0, clamp(12 + lightnessJitter * 0.6, 4, 40));
  switch (brush) {
    case 'pen':
      return hsl(ink.hue, 100, 42);
    case 'pencil':
      return hsl(ink.hue, 92, 40);
    case 'pastel':
      return hsl(ink.hue, 96, clamp(51 + lightnessJitter, 36, 66));
    case 'marker':
      return hsl(ink.hue, 100, 52);
    case 'paint':
      return hsl(ink.hue, 95, clamp(50 + lightnessJitter, 34, 66));
    case 'charcoal':
      return hsl(ink.hue, 92, 27);
  }
}

interface Bristle {
  offset: number; // -1..1 across the brush width
  alpha: number;
  lightness: number; // +/- jitter
}

/**
 * Paints one stroke onto a context by stamping along the path. Width comes
 * from pressure (real pen pressure, or a speed-based stand-in for a finger
 * or mouse) and the brush's own weight. The context is expected to already
 * be scaled to CSS pixels.
 *
 *   pen       smooth, thin, solid ink
 *   pencil    thin, scattered grain (paper tooth)
 *   pastel    waxy, dense grain with ragged edges and gaps
 *   marker    wide, smooth, slightly translucent
 *   paint     bristle streaks, solid and glossy
 *   charcoal  broad, soft, crumbly grain with a faint smudge
 */
class Painter {
  private lx = 0;
  private ly = 0;
  private lp = 0.6;
  private angle = 0;
  private hasAngle = false;
  private bristles: Bristle[] = [];
  private lastBristle: ({ x: number; y: number } | null)[] = [];

  constructor(
    private ctx: CanvasRenderingContext2D,
    private brush: BrushDef,
    private ink: Ink,
    private weight: number
  ) {
    if (brush.id === 'paint') {
      const n = clamp(Math.round(weight / 2.2), 5, 22);
      for (let i = 0; i < n; i++) {
        const even = n === 1 ? 0 : -1 + (2 * i) / (n - 1);
        this.bristles.push({
          offset: clamp(even + (Math.random() - 0.5) * (2 / n) * 0.6, -1, 1),
          alpha: 0.86 + Math.random() * 0.14,
          lightness: (Math.random() - 0.5) * 22,
        });
        this.lastBristle.push(null);
      }
    }
  }

  private widthAt(p: number) {
    const [a, b] = this.brush.pressure;
    return this.weight * lerp(a, b, clamp(p, 0, 1));
  }

  begin(x: number, y: number, p: number) {
    this.lx = x;
    this.ly = y;
    this.lp = p;
    this.stamp(x, y, p, Math.max(0.7, this.widthAt(p) * 0.3));
  }

  lineTo(x: number, y: number, p: number) {
    const dx = x - this.lx;
    const dy = y - this.ly;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.01) return;

    // Smoothed travel direction (used by the paint bristles).
    const a = Math.atan2(dy, dx);
    if (!this.hasAngle) {
      this.angle = a;
      this.hasAngle = true;
    } else {
      let d = a - this.angle;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      this.angle += d * 0.35;
    }

    const minW = Math.min(this.widthAt(this.lp), this.widthAt(p));
    const step = Math.max(0.6, minW * 0.16);
    const n = Math.max(1, Math.ceil(dist / step));
    const realStep = dist / n;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      this.stamp(this.lx + dx * t, this.ly + dy * t, lerp(this.lp, p, t), realStep);
    }
    this.lx = x;
    this.ly = y;
    this.lp = p;
  }

  /**
   * Scatters `density` dots per px^2 across the disc of diameter `w`. The
   * count scales with the distance travelled since the last stamp, so
   * texture density is the same however fast the pointer moves.
   */
  private grain(
    x: number,
    y: number,
    w: number,
    step: number,
    o: {
      density: number;
      rMin: number;
      rMax: number;
      aMin: number;
      aMax: number;
      /** >1 packs dots toward the centre of the stroke. */
      spread?: number;
      /** 0..1: how much alpha fades towards the edge. */
      edgeFade?: number;
      jitter?: number;
    }
  ) {
    const ctx = this.ctx;
    const expected = o.density * w * step;
    let n = Math.floor(expected);
    if (Math.random() < expected - n) n++;
    const id = this.brush.id;
    const spread = o.spread ?? 0.5;
    for (let k = 0; k < n; k++) {
      const rr = Math.pow(Math.random(), spread);
      const th = Math.random() * Math.PI * 2;
      const r = (w / 2) * rr;
      let alpha = o.aMin + Math.random() * (o.aMax - o.aMin);
      if (o.edgeFade) alpha *= 1 - o.edgeFade * rr * rr;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.fillStyle = inkColor(id, this.ink, (Math.random() - 0.5) * 2 * (o.jitter ?? 0));
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(th) * r,
        y + Math.sin(th) * r,
        o.rMin + Math.random() * (o.rMax - o.rMin),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private stamp(x: number, y: number, p: number, step: number) {
    const ctx = this.ctx;
    const w = this.widthAt(p);
    const id = this.brush.id;
    const light = 0.45 + 0.55 * clamp(p, 0, 1); // lighter touch -> sparser grain

    if (id === 'pen' || id === 'marker') {
      ctx.fillStyle = inkColor(id, this.ink);
      ctx.beginPath();
      ctx.arc(x, y, w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (id === 'pencil') {
      ctx.fillStyle = inkColor('pencil', this.ink);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, w * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.grain(x, y, w, step, {
        density: 1.7 * light,
        rMin: 0.4,
        rMax: 0.8,
        aMin: 0.55,
        aMax: 1,
        spread: 0.55,
      });
      return;
    }

    if (id === 'pastel') {
      this.grain(x, y, w, step, {
        density: 0.78 * light,
        rMin: 0.7,
        rMax: 1.5,
        aMin: 0.85,
        aMax: 1,
        spread: 0.5,
        jitter: 9,
      });
      return;
    }

    if (id === 'charcoal') {
      ctx.fillStyle = inkColor('charcoal', this.ink);
      ctx.globalAlpha = 0.1 * light;
      ctx.beginPath();
      ctx.arc(x, y, w * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.grain(x, y, w, step, {
        density: 0.75 * light,
        rMin: 0.6,
        rMax: 1.9,
        aMin: 0.25,
        aMax: 0.95,
        spread: 0.62,
        edgeFade: 0.75,
      });
      return;
    }

    // paint: parallel bristle lines that follow the direction of travel
    const hw = w / 2;
    const lw = Math.max(1, (w / this.bristles.length) * 2.2);
    const nx = -Math.sin(this.angle);
    const ny = Math.cos(this.angle);
    ctx.lineCap = 'round';
    ctx.lineWidth = lw;
    for (let i = 0; i < this.bristles.length; i++) {
      const b = this.bristles[i];
      const bx = x + nx * b.offset * hw;
      const by = y + ny * b.offset * hw;
      const prev = this.lastBristle[i];
      // Rare dry gap, like a bristle lifting off the paper.
      const dry = prev !== null && Math.random() < 0.012;
      if (!dry) {
        ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = inkColor('paint', this.ink, b.lightness);
        ctx.beginPath();
        if (prev && this.hasAngle) {
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(bx, by);
        } else {
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + 0.01, by);
        }
        ctx.stroke();
      }
      this.lastBristle[i] = { x: bx, y: by };
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

interface Sample {
  x: number;
  y: number;
  t: number;
  p: number;
}

/**
 * Real pressure from a pen (and from touchscreens that report force);
 * otherwise a stand-in derived from drawing speed — slow strokes come out
 * heavier, fast flicks thin out — smoothed so the width doesn't jitter.
 */
function resolvePressure(
  e: { pointerType: string; pressure: number; clientX: number; clientY: number; timeStamp: number },
  prev: Sample | null
): number {
  const hasRealPressure =
    e.pressure > 0 &&
    (e.pointerType === 'pen' || (e.pointerType === 'touch' && e.pressure !== 0.5));
  if (hasRealPressure) return e.pressure;
  if (!prev) return 0.6;
  const dt = Math.max(1, e.timeStamp - prev.t);
  const speed = Math.hypot(e.clientX - prev.x, e.clientY - prev.y) / dt; // px/ms
  const target = clamp(1 - speed * 0.35, 0.3, 1);
  return prev.p + (target - prev.p) * 0.2;
}


// ---------------------------------------------------------------------------
// Sliders
// ---------------------------------------------------------------------------

function Slider({
  orientation,
  ratio,
  onRatio,
  label,
  valueText,
  className,
  style,
  children,
}: {
  orientation: 'vertical' | 'horizontal';
  ratio: number;
  onRatio: (r: number) => void;
  label: string;
  valueText: string;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  function update(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t =
      orientation === 'vertical'
        ? (e.clientY - r.top) / r.height
        : (e.clientX - r.left) / r.width;
    onRatio(clamp(t, 0, 1));
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const step = 0.05;
    const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const backward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    if (e.key === forward) onRatio(clamp(ratio + step, 0, 1));
    else if (e.key === backward) onRatio(clamp(ratio - step, 0, 1));
    else return;
    e.preventDefault();
  }

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic pointer — ignore */
        }
        update(e);
      }}
      onPointerMove={(e) => {
        if (dragging.current) update(e);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brush icon: a short stroke painted with the real brush engine
// ---------------------------------------------------------------------------

const PREVIEW_SIZE = 20;

function BrushPreview({ brush }: { brush: BrushDef }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Rendered at 3x or more so the grain stays visible at 20px.
    const scale = clamp(Math.max(window.devicePixelRatio || 1, 3), 3, 4);
    const S = PREVIEW_SIZE;
    canvas.width = S * scale;
    canvas.height = S * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, S, S);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A short wavy stroke, rising left to right, heavier in the middle.
    const padX = brush.previewWeight * 0.5 + 1.5;
    const steps = 28;
    const painter = new Painter(ctx, brush, { hue: 0, mono: true }, brush.previewWeight);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = padX + (S - 2 * padX) * t;
      const y = S / 2 + 3.4 * Math.sin(t * Math.PI * 2 + Math.PI) - (t - 0.5) * 5;
      const p = 0.5 + 0.5 * Math.sin(t * Math.PI);
      if (i === 0) painter.begin(x, y, p);
      else painter.lineTo(x, y, p);
    }
  }, [brush]);

  return (
    <canvas
      ref={ref}
      className={styles.preview}
      style={{ opacity: brush.opacity }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Session {
  pointerId: number;
  painter: Painter;
  brush: BrushDef;
  last: Sample;
  pts: { x: number; y: number; p: number }[];
}

export default function DoodleLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // committed doodles
  const strokeRef = useRef<HTMLCanvasElement | null>(null); // stroke being drawn
  const sessionRef = useRef<Session | null>(null);
  const penSeenAt = useRef(-Infinity);

  const [active, setActive] = useState(false);
  const [hue, setHue] = useState(18); // starts near studio-orange
  const [brushId, setBrushId] = useState<BrushId>('marker');
  const [weights, setWeights] = useState<Record<BrushId, number>>(
    () =>
      Object.fromEntries(ALL_BRUSHES.map((b) => [b.id, b.defaultWeight])) as Record<BrushId, number>
  );
  const [weightOpen, setWeightOpen] = useState(false);

  // Sizes both canvases to the viewport, keeping what's already drawn when
  // the window resizes (mobile browsers resize the viewport whenever the
  // address bar slides in or out).
  useEffect(() => {
    const main = canvasRef.current;
    const over = strokeRef.current;
    if (!main || !over) return;

    function resize() {
      if (!main || !over) return;
      const dpr = window.devicePixelRatio || 1;
      const { innerWidth: w, innerHeight: h } = window;

      let snapshot: HTMLCanvasElement | null = null;
      if (main.width > 0 && main.height > 0) {
        snapshot = document.createElement('canvas');
        snapshot.width = main.width;
        snapshot.height = main.height;
        snapshot.getContext('2d')?.drawImage(main, 0, 0);
      }

      for (const c of [main, over]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }

      if (snapshot) {
        const ctx = main.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(snapshot, 0, 0);
          ctx.restore();
        }
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  function commitStroke(brush: BrushDef) {
    const main = canvasRef.current;
    const over = strokeRef.current;
    const mainCtx = main?.getContext('2d');
    const overCtx = over?.getContext('2d');
    if (!main || !over || !mainCtx || !overCtx) return;

    // Stamp the finished stroke into the main canvas at the brush's opacity,
    // then clear the live layer.
    mainCtx.save();
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.globalAlpha = brush.opacity;
    mainCtx.drawImage(over, 0, 0);
    mainCtx.restore();

    overCtx.save();
    overCtx.setTransform(1, 0, 0, 1, 0, 0);
    overCtx.clearRect(0, 0, over.width, over.height);
    overCtx.restore();
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active || sessionRef.current) return;

    if (e.pointerType === 'pen') penSeenAt.current = performance.now();
    else if (e.pointerType === 'touch' && performance.now() - penSeenAt.current < PALM_REJECT_MS) {
      return; // resting palm while drawing with a pencil
    }

    const over = strokeRef.current;
    const ctx = over?.getContext('2d');
    if (!over || !ctx) return;

    try {
      over.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer — ignore */
    }
    setWeightOpen(false);

    const brush = BRUSH_BY_ID[brushId];
    over.style.opacity = String(brush.opacity);
    const p = resolvePressure(e, null);
    const painter = new Painter(ctx, brush, { hue, mono: false }, weights[brushId]);
    painter.begin(e.clientX, e.clientY, p);

    sessionRef.current = {
      pointerId: e.pointerId,
      painter,
      brush,
      last: { x: e.clientX, y: e.clientY, t: e.timeStamp, p },
      pts: [{ x: e.clientX, y: e.clientY, p }],
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const s = sessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;

    // A stylus can report several samples per frame — use all of them.
    const native = e.nativeEvent;
    const events: PointerEvent[] =
      typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length
        ? native.getCoalescedEvents()
        : [native];

    for (const ev of events) {
      const p = resolvePressure(ev, s.last);
      s.last = { x: ev.clientX, y: ev.clientY, t: ev.timeStamp, p };
      s.pts.push({ x: ev.clientX, y: ev.clientY, p });

      // Curve through the middle of every three samples so strokes stay
      // smooth instead of following jagged raw samples.
      if (s.pts.length < 3) continue;
      const [a, b, c] = s.pts.slice(-3);
      const start = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, p: (a.p + b.p) / 2 };
      const end = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2, p: (b.p + c.p) / 2 };

      const len = Math.hypot(b.x - start.x, b.y - start.y) + Math.hypot(end.x - b.x, end.y - b.y);
      const n = Math.max(1, Math.ceil(len / 4));
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const u = 1 - t;
        s.painter.lineTo(
          u * u * start.x + 2 * u * t * b.x + t * t * end.x,
          u * u * start.y + 2 * u * t * b.y + t * t * end.y,
          lerp(start.p, end.p, t)
        );
      }
      s.pts = s.pts.slice(-2);
    }
  }

  function finishStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
    const s = sessionRef.current;
    if (!s || e.pointerId !== s.pointerId) return;

    // Run out to the final raw sample so the stroke ends where the pointer
    // actually left off.
    const last = s.pts[s.pts.length - 1];
    if (last) s.painter.lineTo(last.x, last.y, last.p);

    commitStroke(s.brush);
    sessionRef.current = null;
  }

  function handleClear() {
    const main = canvasRef.current;
    const ctx = main?.getContext('2d');
    if (!main || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, main.width, main.height);
    ctx.restore();
  }

  // Reads straight off the canvas and triggers a local download — nothing
  // is uploaded or stored by the site.
  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `doodle-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function selectBrush(id: BrushId) {
    if (id === brushId) {
      setWeightOpen((v) => !v);
    } else {
      setBrushId(id);
      setWeightOpen(true);
    }
  }

  function toggleActive() {
    setActive((v) => !v);
    setWeightOpen(false);
  }

  const activeBrush = BRUSH_BY_ID[brushId];
  const weightRatio =
    (weights[brushId] - activeBrush.minWeight) /
    (activeBrush.maxWeight - activeBrush.minWeight);

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} />
      <canvas
        ref={strokeRef}
        className={styles.stroke}
        style={{ pointerEvents: active ? 'auto' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />

      <div className={styles.dock}>
        {active && (
          <div className={styles.tools}>
            <Slider
              orientation="vertical"
              className={styles.hue}
              style={{ background: HUE_GRADIENT }}
              label="Doodle color"
              valueText={`Hue ${Math.round(hue)}`}
              ratio={hue / HUE_MAX}
              onRatio={(r) => setHue(r * HUE_MAX)}
            >
              <div
                className={styles.hueThumb}
                style={{
                  top: `${(hue / HUE_MAX) * 100}%`,
                  background: thumbColor(hue),
                }}
              />
            </Slider>

            <div className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className={styles.brushes}>
              {BRUSHES.map((b) => {
                const selected = b.id === brushId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={styles.brush}
                    aria-pressed={selected}
                    aria-label={`${b.label} brush`}
                    onClick={() => selectBrush(b.id)}
                  >
                    <BrushPreview brush={b} />
                    {selected && weightOpen && (
                      // Stop clicks on the slider from re-toggling the brush.
                      <div onClick={(e) => e.stopPropagation()}>
                        <Slider
                          orientation="horizontal"
                          className={styles.weight}
                          label={`${b.label} weight`}
                          valueText={`${weights[b.id].toFixed(1)} pixels`}
                          ratio={weightRatio}
                          onRatio={(r) =>
                            setWeights((prev) => ({
                              ...prev,
                              [b.id]: b.minWeight + r * (b.maxWeight - b.minWeight),
                            }))
                          }
                        >
                          <div className={styles.weightTrack} />
                          <div
                            className={styles.weightThumb}
                            style={{ left: `${weightRatio * 100}%` }}
                          />
                        </Slider>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.bottom}>
          {active && (
            <>
              <button type="button" className={styles.action} onClick={handleSave}>
                Save
              </button>
              <button type="button" className={styles.action} onClick={handleClear}>
                Clear
              </button>
            </>
          )}
          <button
            type="button"
            className={styles.toggle}
            onClick={toggleActive}
            aria-pressed={active}
            aria-label={active ? 'Turn off doodling' : 'Turn on doodling'}
          >
            {/* Keyed by `active` so each state's <img> tracks its own load
                failure instead of one broken icon disabling the other. */}
            <BrushToggleIcon key={active ? 'close' : 'brush'} active={active} />
          </button>
        </div>
      </div>
    </>
  );
}

function BrushToggleIcon({ active }: { active: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return active ? <CloseIcon /> : <BrushIcon />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={active ? CLOSE_ICON_SRC : BRUSH_ICON_SRC}
      alt=""
      width={active ? 36 : 38}
      height={active ? 36 : 38}
      draggable={false}
      onError={() => setFailed(true)}
    />
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
