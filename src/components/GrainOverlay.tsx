"use client";

import { useEffect, useRef } from "react";

const GRAIN_CONFIG = {
  density: 0.12,
  light: { shadowAlpha: 0.08, highlightAlpha: 0.22 },
  dark: { shadowAlpha: 0.06, highlightAlpha: 0.28 },
};

const DARK_STAGES = ["charcoal", "near-black"];
const FLICKER_INTERVAL_MS = 90;

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
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function generateNoise(isDark: boolean) {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      noiseCanvas.width = canvas!.width;
      noiseCanvas.height = canvas!.height;

      const cfg = isDark ? GRAIN_CONFIG.dark : GRAIN_CONFIG.light;
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
      document.querySelectorAll("img, video").forEach((el) => {
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
      ctx!.drawImage(noiseCanvas, 0, 0);
      clearMediaRegions();
    }

    function paintGrain(isDark: boolean) {
      lastIsDark = isDark;
      generateNoise(isDark);
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

    let flickerInterval: ReturnType<typeof setInterval> | null = null;
    if (!prefersReducedMotion) {
      flickerInterval = setInterval(() => {
        paintGrain(lastIsDark);
      }, FLICKER_INTERVAL_MS);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(resizeTimer);
      if (flickerInterval) clearInterval(flickerInterval);
    };
  }, []);

  return <canvas ref={canvasRef} id="grainCanvas" aria-hidden="true" />;
}