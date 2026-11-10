"use client";

import { useEffect, useRef } from "react";

const GRAIN_CONFIG = {
  density: 0.12,
  dark: { shadowAlpha: 0.045, highlightAlpha: 0.21 },
};

// Paper grain, used on the light stages (light, warm, dusk). Soft, dense
// noise built from a fine layer and a coarser layer, drawn as a repeating
// tile. strength: higher = more visible. Each tick it picks one of
// PAPER_TILES tiles and shifts it by a few pixels, so it moves very subtly.
const PAPER = {
  fine: 0.026,
  coarse: 0.038,
  whiteShare: 0.5,
  tileSize: 512,
  tiles: 3,
};

const DARK_STAGES = ["charcoal", "near-black"];
const FLICKER_INTERVAL_MS = 320; // dark stages: higher = slower
const PAPER_INTERVAL_MS = 600; // light stages: higher = slower

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!noiseCanvasRef.current) {
      noiseCanvasRef.current = document.createElement("canvas");
    }
    const noiseCanvas = noiseCanvasRef.current;
    const noiseCtx = noiseCanvas.getContext("2d");
    if (!noiseCtx) return;

    let lastIsDark = false;
    let paperTiles: HTMLCanvasElement[] = [];
    let paperPattern: CanvasPattern[] = [];
    let paperIndex = 0;
    let paperX = 0;
    let paperY = 0;

    function noiseLayer(size: number, scale: number, alpha: number) {
      const s = Math.ceil(size / scale);
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const x = c.getContext("2d")!;
      const img = x.createImageData(s, s);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const white = Math.random() < PAPER.whiteShare;
        const v = white ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.floor(Math.random() * alpha * 255 * (white ? PAPER.whiteShare : 1));
      }
      x.putImageData(img, 0, 0);
      return c;
    }

    function buildPaperTiles() {
      if (paperTiles.length) return;
      const T = PAPER.tileSize;
      for (let n = 0; n < PAPER.tiles; n++) {
        const t = document.createElement("canvas");
        t.width = t.height = T;
        const x = t.getContext("2d")!;
        x.imageSmoothingEnabled = true;
        x.drawImage(noiseLayer(T, 1, PAPER.fine), 0, 0, T, T);
        x.drawImage(noiseLayer(T, 3, PAPER.coarse), 0, 0, T, T);
        paperTiles.push(t);
      }
      paperPattern = paperTiles.map((t) => ctx!.createPattern(t, "repeat")!);
    }

    function sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
    }

    function nextPaperFrame() {
      paperIndex = Math.floor(Math.random() * PAPER.tiles);
      paperX = Math.floor(Math.random() * PAPER.tileSize);
      paperY = Math.floor(Math.random() * PAPER.tileSize);
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function generateNoise() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      noiseCanvas.width = canvas!.width;
      noiseCanvas.height = canvas!.height;

      const cfg = GRAIN_CONFIG.dark; // specks are only used on the dark stages
      const imgData = noiseCtx!.createImageData(noiseCanvas.width, noiseCanvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < GRAIN_CONFIG.density) {
          const isShadow = Math.random() < 0.5;
          if (isShadow) {
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
            d[i + 3] = Math.floor(Math.random() * cfg.shadowAlpha * 255);
          } else {
            d[i] = 255;
            d[i + 1] = 255;
            d[i + 2] = 255;
            d[i + 3] = Math.floor(Math.random() * cfg.highlightAlpha * 255);
          }
        }
      }
      noiseCtx!.putImageData(imgData, 0, 0);
    }

    function clearMediaRegions() {
      const dpr = window.devicePixelRatio || 1;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      function clearEl(el: Element) {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        if (rect.right < 0 || rect.bottom < 0 || rect.left > vw || rect.top > vh) return;
        ctx!.clearRect(rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr);
      }

      // Only real, successfully-loaded media counts — an <img> from
      // next/image still exists in the DOM even when its src hasn't
      // resolved to a real photo yet (as with your still-placeholder
      // project thumbnails), and naturalWidth stays 0 until it has.
      // Without this check, every still-empty thumbnail's full-size
      // <img> tag was getting its grain cleared as if it were a photo —
      // that rectangle is what you were seeing.
      // Small decorative images (the hand-drawn title underline, the cursor
      // icon, nav, dimmer and doodle icons) sit in the page all the time,
      // even while invisible. Clearing the grain under them left a
      // grain-free box beneath every title, so they are skipped here.
      const DECORATIVE =
        ".title-underline, .sdv-cur, .sara-float-nav, .dimmer-btn, .elie-trigger-icon, [data-grain-keep]";
      document.querySelectorAll("img, video").forEach((el) => {
        if (el.matches(DECORATIVE) || el.closest(DECORATIVE)) return;
        if (el instanceof HTMLImageElement && el.naturalWidth === 0) return;
        if (el instanceof HTMLVideoElement && el.videoWidth === 0) return;
        clearEl(el);
      });
      document.querySelectorAll("div, a, section, figure").forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        // Only real photo backgrounds (url(...)) count — a CSS gradient
        // (like the diagonal-stripe placeholder pattern) is technically a
        // background-image too, and was punching a grain-free rectangle
        // over every still-empty project card.
        if (bg && bg !== "none" && bg.includes("url(")) clearEl(el);
      });
    }

    function renderFrame() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (lastIsDark) {
        ctx!.drawImage(noiseCanvas, 0, 0);
      } else if (paperPattern.length) {
        ctx!.save();
        ctx!.translate(paperX, paperY);
        ctx!.fillStyle = paperPattern[paperIndex];
        ctx!.fillRect(-paperX, -paperY, canvas!.width, canvas!.height);
        ctx!.restore();
      }
      clearMediaRegions();
    }

    function paintGrain(isDark: boolean) {
      lastIsDark = isDark;
      if (isDark) {
        generateNoise();
      } else {
        sizeCanvas();
        buildPaperTiles();
        nextPaperFrame();
      }
      renderFrame();
    }

    function getIsDark() {
      const stage = document.documentElement.getAttribute("data-dimmer-stage");
      return DARK_STAGES.includes(stage || "light");
    }

    paintGrain(getIsDark());

    const observer = new MutationObserver(() => paintGrain(getIsDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-dimmer-stage"],
    });

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => paintGrain(lastIsDark), 200);
    }
    window.addEventListener("resize", handleResize);

    let scrollTicking = false;
    function handleScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        renderFrame();
        scrollTicking = false;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    let flickerTimer: ReturnType<typeof setTimeout> | null = null;
    function tick() {
      if (lastIsDark) {
        paintGrain(true);
      } else {
        nextPaperFrame();
        renderFrame();
      }
      flickerTimer = setTimeout(tick, lastIsDark ? FLICKER_INTERVAL_MS : PAPER_INTERVAL_MS);
    }
    if (!prefersReducedMotion) {
      flickerTimer = setTimeout(tick, FLICKER_INTERVAL_MS);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(resizeTimer);
      if (flickerTimer) clearTimeout(flickerTimer);
    };
  }, []);

  return <canvas ref={canvasRef} id="grainCanvas" aria-hidden="true" />;
}
