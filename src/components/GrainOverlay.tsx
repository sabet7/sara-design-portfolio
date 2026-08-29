"use client";

import { useEffect, useRef } from "react";

// Density and alpha values are intentionally lower than the old Webflow
// version — Sara asked for a more subtle grain in this rebuild.
const GRAIN_CONFIG = {
  density: 0.06,
  light: { shadowAlpha: 0.04, highlightAlpha: 0.13 },
  dark: { shadowAlpha: 0.03, highlightAlpha: 0.17 },
};

const DARK_STAGES = ["charcoal", "near-black"];

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

    // Same "punch holes over real photos" logic as the old script — the
    // grain never sits on top of an <img>, <video>, or a background-image.
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

      document.querySelectorAll("img, video").forEach(clearEl);
      document.querySelectorAll("div, a, section, figure").forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none") clearEl(el);
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

    // Dimmer.tsx sets data-dimmer-stage independently — this observer is
    // how grain reacts to it without any direct wiring between components.
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

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} id="grainCanvas" aria-hidden="true" />;
}

