"use client";

import { useEffect, useRef, useState } from "react";
import { Rive } from "@rive-app/canvas";
import { lipSyncData } from "./lipSyncData";
import styles from "./DuolingoCharacter.module.css";

const DEFAULT_RIV_SRC = "/media/case-studies/duolingo/duolingo-character.riv";
const DEFAULT_AUDIO_SRC = "/media/case-studies/duolingo/duolingo-recording.mp3";
const ARTBOARD = "DUOLINGO CHARACTER";
const STATE_MACHINE = "State Machine 1";
// Name of the Rive view-model number input that drives the mouth shape.
// Has to match the input's name inside the .riv file exactly — typo and
// all — or Rive silently won't find it and the mouth just never moves.
const VISEME_INPUT = "vismae";

// The Data Binding API (autoBind / viewModelInstance) is newer than what
// @rive-app/canvas's published TypeScript types cover as of this writing,
// so these two shapes describe just the bits this component actually
// touches, instead of reaching for `any` everywhere below.
interface RiveNumberInput {
  value: number;
}
interface RiveViewModelInstance {
  number(name: string): RiveNumberInput | null;
}

interface DuolingoCharacterProps {
  /** Override only if this specific instance needs different assets. */
  rivSrc?: string;
  audioSrc?: string;
}

/**
 * The lip-synced Duolingo character from the original Webflow embed,
 * ported to React. Behavior matches the original 1:1: click to play the
 * recording, the character's mouth shape steps through `lipSyncData` in
 * lockstep with `audio.currentTime` via requestAnimationFrame — the same
 * Rhubarb-generated viseme data driving the same Rive "vismae" input.
 */
export default function DuolingoCharacter({
  rivSrc = DEFAULT_RIV_SRC,
  audioSrc = DEFAULT_AUDIO_SRC,
}: DuolingoCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visemeInputRef = useRef<RiveNumberInput | null>(null);
  const lipIdxRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  function setVismae(n: number) {
    const input = visemeInputRef.current;
    if (!input) return;
    try {
      input.value = n;
    } catch {
      // Rive isn't loaded yet — same silent no-op as the original embed.
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 500;
    canvas.height = 500;

    const audio = new Audio(audioSrc);
    audio.preload = "auto";
    audioRef.current = audio;

    function handleEnded() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setVismae(0);
      lipIdxRef.current = 0;
      setPlaying(false);
    }
    audio.addEventListener("ended", handleEnded);

    const rive = new Rive({
      src: rivSrc,
      canvas,
      autoplay: true,
      autoBind: true,
      artboard: ARTBOARD,
      stateMachines: STATE_MACHINE,
      onLoad: () => {
        rive.resizeDrawingSurfaceToCanvas();
        const vmi = (
          rive as unknown as { viewModelInstance?: RiveViewModelInstance }
        ).viewModelInstance;
        const vismae = vmi?.number(VISEME_INPUT) ?? null;
        if (vismae) {
          vismae.value = 0;
          visemeInputRef.current = vismae;
          setReady(true);
        }
      },
      onLoadError: (e) => console.error("Rive load error:", e),
    });

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rive.cleanup();
    };
    // rivSrc/audioSrc are only ever read once per mount — same as the
    // original embed, which loaded them a single time too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncLoop() {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    const t = audio.currentTime;
    while (
      lipIdxRef.current < lipSyncData.length - 1 &&
      t >= lipSyncData[lipIdxRef.current + 1].t
    ) {
      lipIdxRef.current++;
    }
    setVismae(lipSyncData[lipIdxRef.current].n);
    rafRef.current = requestAnimationFrame(syncLoop);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!ready || !audio) return;

    if (playing) {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setVismae(0);
      setPlaying(false);
    } else {
      audio.play();
      lipIdxRef.current = 0;
      setPlaying(true);
      syncLoop();
    }
  }

  return (
    <div className={styles.wrap} onClick={togglePlay}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div
        className={styles.overlay}
        style={{ opacity: playing ? 0 : 1 }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="40" fill="white" fillOpacity="0.85" />
          <polygon points="32,24 32,56 58,40" fill="#1CB0F6" />
        </svg>
      </div>
    </div>
  );
}
