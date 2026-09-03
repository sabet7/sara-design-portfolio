'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './VoiceNote.module.css';

interface VoiceNoteProps {
  /** Path to the audio file, e.g. "/media/case-studies/hakmigo/content/voice-note-1.mp3" */
  src: string;
  /** Optional short caption shown next to the widget. Keep it brief. */
  label?: string;
  barCount?: number;
}

export default function VoiceNote({ src, label, barCount = 32 }: VoiceNoteProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, (_, i) => fallbackHeight(src, i))
  );

  // Build a real waveform from the audio file, client-side only.
  useEffect(() => {
    let cancelled = false;

    async function buildWaveform() {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const res = await fetch(src);
        const arrayBuffer = await res.arrayBuffer();
        const ctx = new AudioContextClass();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const channel = audioBuffer.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / barCount));
        const peaks: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channel[start + j] ?? 0);
          }
          peaks.push(sum / blockSize);
        }

        const max = Math.max(...peaks, 0.0001);
        const normalized = peaks.map((p) => 0.18 + (p / max) * 0.82);

        if (!cancelled) setBars(normalized);
        ctx.close();
      } catch {
        // Decoding can fail (CORS, format) — the fallback bars keep the
        // widget looking right and playback still works either way.
      }
    }

    buildWaveform();
    return () => {
      cancelled = true;
    };
  }, [src, barCount]);

  const stopTicking = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration) setProgress(audio.currentTime / audio.duration);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    stopTicking();
    setIsPlaying(false);
    setProgress(0);
    setIsOpen(false);
  }, [stopTicking]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      stopTicking();
      rafRef.current = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setIsPlaying(false);
      stopTicking();
    };
    const onEnded = () => handleStop();

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      stopTicking();
    };
  }, [tick, stopTicking, handleStop]);

  function handleOpenAndPlay() {
    setIsOpen(true);
    requestAnimationFrame(() => {
      audioRef.current?.play();
    });
  }

  function handleTogglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  return (
    <span className={styles.wrap}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {!isOpen ? (
        <button
          type="button"
          className={styles.idleButton}
          onClick={handleOpenAndPlay}
          aria-label={label ? `Play voice note: ${label}` : 'Play voice note'}
        >
          <PlayIcon />
        </button>
      ) : (
        <span className={styles.pill}>
          <button
            type="button"
            className={styles.stopButton}
            onClick={handleStop}
            aria-label="Stop voice note"
          >
            <StopIcon />
          </button>

          <span className={styles.waveform} aria-hidden="true">
            {bars.map((h, i) => (
              <span
                key={i}
                className={
                  i / bars.length <= progress ? styles.barPlayed : styles.bar
                }
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            ))}
          </span>

          <button
            type="button"
            className={styles.playToggle}
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause voice note' : 'Resume voice note'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon small />}
          </button>
        </span>
      )}

      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}

function fallbackHeight(seed: string, index: number) {
  const s = `${seed}-${index}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 0.25 + (hash % 100) / 140;
}

function PlayIcon({ small }: { small?: boolean }) {
  const size = small ? 14 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
    </svg>
  );
}