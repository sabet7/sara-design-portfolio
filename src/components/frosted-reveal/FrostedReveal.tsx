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

// Baked directly into the canvas now (see paintFrost) rather than via
// backdrop-filter, since backdrop-filter blurs the whole element's
// backdrop as one operation — it isn't modulated by the canvas's own
// alpha, so erasing the canvas could never reveal a sharp image, only
// remove the white tint sitting on top of an unchanged blur.
//
// Bumped up from 14px, and the frost is no longer a flat light-gray wash
// over the blur (that read as "frosted glass," not a moody soft-focus
// photo). Now it's just a heavier blur plus a dark vignette at the edges —
// the actual color of the photo still shows through the middle, the way a
// deliberately out-of-focus, vignetted portrait does.
const BLUR_PX = 26;

// Reform-on-leave spring constants (mass = 1). DAMPING/STIFFNESS below
// give a single gentle overshoot-then-settle — like a droplet of liquid
// closing back over a touched spot and wobbling once before it's still,
// instead of the old behavior (an instant, motionless repaint).
const SPRING_STIFFNESS = 90;
const SPRING_DAMPING = 14;

/** Draws `img` into the canvas so it fills exactly dw x dh while preserving
 *  aspect ratio and cropping overflow — matching the real <img>'s
 *  `object-fit: cover` behavior (see FrostedReveal.module.css .image).
 *  Without this, a stretch-to-fit draw looks visibly squished/stretched
 *  next to the real, correctly-cropped photo it's supposed to be hiding,
 *  the moment the wipe reveals it. */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dw: number,
  dh: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0 || dw === 0 || dh === 0) return;

  const imageRatio = iw / ih;
  const destRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;

  if (imageRatio > destRatio) {
    // Image is wider than the destination box — crop the left/right edges.
    sw = ih * destRatio;
    sx = (iw - sw) / 2;
  } else {
    // Image is taller than the destination box — crop the top/bottom edges.
    sh = iw / destRatio;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
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
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Off-screen, never-erased copy of the freshly-painted frost. wipeAt only
  // ever erases pixels on the *visible* canvas; this buffer is what the
  // reform animation repaints from, so "healing" a spot back is just
  // re-copying the untouched original there — always pixel-identical to
  // its surroundings, never a mismatched patch.
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const reformAnimRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Falls back to a square box if width/height ever come through as 0 or
  // undefined from the call site, instead of silently collapsing to 0px
  // tall (which is what was actually making the whole effect "disappear" —
  // see the .container minHeight fallback in FrostedReveal.module.css for
  // the second layer of the same safety net).
  const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : '1 / 1';

  const paintFrost = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!canvas || !container || !img) return;
    if (!img.complete || img.naturalWidth === 0) return; // image not ready yet

    // Any reform animation mid-flight is now painting over stale geometry —
    // stop it before we resize/repaint everything under it.
    if (reformAnimRef.current) {
      cancelAnimationFrame(reformAnimRef.current);
      reformAnimRef.current = null;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // container not laid out yet

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Bake a blurred, cover-cropped copy of the actual image into the
    // canvas — this is the pixel content that erasing will reveal a hole
    // in, so a wipe uncovers the sharp <img> underneath (at the same crop
    // and scale) instead of a mismatched stretch.
    ctx.filter = `blur(${BLUR_PX}px)`;
    drawImageCover(ctx, img, rect.width, rect.height);
    ctx.filter = 'none';

    // Vignette instead of a flat white/gray wash: darker at the corners,
    // nearly untouched at the center, so the blurred photo's own color
    // still reads through — a moody soft-focus look rather than a
    // frosted-glass tint sitting on top of it.
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const vignette = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, Math.max(rect.width, rect.height) * 0.7
    );
    vignette.addColorStop(0, 'rgba(10, 12, 20, 0)');
    vignette.addColorStop(0.65, 'rgba(10, 12, 20, 0.1)');
    vignette.addColorStop(1, 'rgba(10, 12, 20, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Snapshot this pristine frost into the buffer canvas. Device-pixel
    // dimensions match the visible canvas exactly, so later draws copy it
    // back 1:1 with no extra scaling math.
    if (!bufferCanvasRef.current) {
      bufferCanvasRef.current = document.createElement('canvas');
    }
    const buffer = bufferCanvasRef.current;
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    const bufferCtx = buffer.getContext('2d');
    if (bufferCtx) {
      bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
      bufferCtx.drawImage(canvas, 0, 0);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    // If the image loaded from cache before this handler was attached,
    // its onLoad event already fired and was missed — this catches that
    // case by checking the already-loaded state directly.
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (imgLoaded) paintFrost();
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(paintFrost);
    resizeObserver.observe(container);
    // Belt-and-suspenders alongside the ResizeObserver above: a plain
    // window resize listener as a fallback path to the same repaint,
    // in case some non-standard box-size change (a page-level CSS zoom or
    // transform, browser chrome changing) doesn't reliably fire
    // ResizeObserver in every browser.
    window.addEventListener('resize', paintFrost);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', paintFrost);
    };
  }, [paintFrost, imgLoaded]);

  // Belt-and-suspenders: make sure a reform animation never keeps running
  // (and holding a reference to a stale canvas) after this component is
  // gone.
  useEffect(() => {
    return () => {
      if (reformAnimRef.current) cancelAnimationFrame(reformAnimRef.current);
    };
  }, []);

  function wipeAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    lastPosRef.current = { x, y };

    // A slow, gentle pulse on the wipe radius — a couple of pixels either
    // way — so the melted edge breathes slightly as you drag instead of
    // holding one perfectly rigid circle. Subtle on purpose: this is a
    // "liquid surface" cue, not a visible wobble.
    const pulse = Math.sin(performance.now() / 140) * 3;
    const radius = Math.max(wipeRadius + pulse, 8);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const wipeGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    wipeGradient.addColorStop(0, 'rgba(0,0,0,1)');
    wipeGradient.addColorStop(0.7, 'rgba(0,0,0,0.9)');
    wipeGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wipeGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Heals the frost back in, growing outward from (cx, cy) — the last
   *  point the cursor touched — instead of snapping back all at once. The
   *  growth follows a lightly underdamped spring, so the front slightly
   *  overshoots full coverage and settles, the way a liquid surface
   *  closing over a disturbance wobbles once before it's still. */
  function animateReform(cx: number, cy: number) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const buffer = bufferCanvasRef.current;
    if (!canvas || !container || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (reformAnimRef.current) {
      cancelAnimationFrame(reformAnimRef.current);
      reformAnimRef.current = null;
    }

    const rect = container.getBoundingClientRect();
    // The farthest any corner can be from the touched point — once the
    // healing radius reaches this, the whole canvas is covered no matter
    // where the cursor last was.
    const maxRadius = Math.hypot(
      Math.max(cx, rect.width - cx),
      Math.max(cy, rect.height - cy)
    );

    let radius = 0;
    let velocity = 0;
    let lastTime = performance.now();
    const startTime = lastTime;
    // Hard real-time cap, independent of the spring math entirely. This is
    // the actual fix for the bug in your recording: the heal was starting,
    // getting partway through, and then freezing forever — several full
    // seconds of stillness with the frame-by-frame animation clearly
    // having stopped advancing, not just slowed down. That's the signature
    // of a requestAnimationFrame chain silently breaking mid-loop (most
    // likely a thrown error on one frame that stops the next frame from
    // ever getting scheduled — the browser swallows this quietly instead
    // of crashing anything visible). Rather than chase one exact line
    // blind, this guarantees the frost is ALWAYS fully closed again within
    // 900ms of leaving, no matter what interrupts the animation loop.
    const MAX_DURATION_MS = 900;

    function finish() {
      try {
        ctx!.clearRect(0, 0, rect.width, rect.height);
        ctx!.drawImage(buffer!, 0, 0, rect.width, rect.height);
      } catch {
        // Even if something is wrong with the canvas/buffer state, don't
        // leave reformAnimRef pointing at a dead animation — clear it so
        // the next pointer interaction starts clean instead of silently
        // no-op'ing forever.
      }
      reformAnimRef.current = null;
    }

    function step(now: number) {
      try {
        // Clamp dt so a dropped frame (tab backgrounded, etc.) can't send
        // the spring flying on the next tick.
        const dt = Math.min((now - lastTime) / 1000, 1 / 30);
        lastTime = now;

        const force = (maxRadius - radius) * SPRING_STIFFNESS - velocity * SPRING_DAMPING;
        velocity += force * dt;
        radius += velocity * dt;

        ctx!.save();
        ctx!.beginPath();
        ctx!.arc(cx, cy, Math.max(radius, 0), 0, Math.PI * 2);
        ctx!.closePath();
        ctx!.clip();
        ctx!.clearRect(0, 0, rect.width, rect.height);
        ctx!.drawImage(buffer!, 0, 0, rect.width, rect.height);
        ctx!.restore();

        const settled = Math.abs(maxRadius - radius) < 1 && Math.abs(velocity) < 4;
        const runaway = radius > maxRadius * 1.5; // safety valve, shouldn't trigger
        const timedOut = now - startTime > MAX_DURATION_MS;
        if (settled || runaway || timedOut) {
          finish();
          return;
        }
      } catch {
        // Whatever went wrong mid-frame, don't leave the canvas stuck
        // half-wiped forever — snap straight to fully healed and stop.
        finish();
        return;
      }
      reformAnimRef.current = requestAnimationFrame(step);
    }

    reformAnimRef.current = requestAnimationFrame(step);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    // Coming back in mid-heal — stop the reform animation right where it
    // is and resume normal wiping from that state, rather than fighting it
    // frame-by-frame.
    if (reformAnimRef.current) {
      cancelAnimationFrame(reformAnimRef.current);
      reformAnimRef.current = null;
    }
    wipeAt(e.clientX, e.clientY);
  }

  function handlePointerLeave() {
    if (resetOnLeave) {
      animateReform(lastPosRef.current.x, lastPosRef.current.y);
    }
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ aspectRatio }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.image}
        draggable={false}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgFailed(true)}
      />
      {imgFailed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 12,
            color: "#b91c1c",
            background: "#fee2e2",
            padding: 8,
          }}
        >
          Image failed to load: {src}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={styles.frost}
        style={{ opacity: ready ? 1 : 0 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
}
