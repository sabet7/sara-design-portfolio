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
const BLUR_PX = 14;

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

    // Frost tint on top of the baked blur.
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(245, 245, 246, 0.82)');
    gradient.addColorStop(1, 'rgba(245, 245, 246, 0.74)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

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
    return () => resizeObserver.disconnect();
  }, [paintFrost, imgLoaded]);

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
