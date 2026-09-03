"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QA_TREE, ROOT_QUESTIONS } from "@/lib/elieQA";

type Mood = "waiting" | "thinking" | "answered";

// Same public/media/elie/ folder as the existing thinking art. Waiting and
// answered art aren't uploaded yet — MoodArt below falls back to a simple
// placeholder per mood until each file actually exists, so this just starts
// working the moment the real files land with these exact names, no code
// changes needed.
const MOOD_SRC: Record<Mood, string> = {
  waiting: "/media/elie/elie-waiting.webp",
  thinking: "/media/elie/elie-thinking.webp",
  answered: "/media/elie/elie-answered.webp",
};

const MOOD_PLACEHOLDER_EMOJI: Record<Mood, string> = {
  waiting: "🙂",
  thinking: "🤔",
  answered: "✨",
};

function MoodArt({
  mood,
  size,
  failed,
  onFail,
}: {
  mood: Mood;
  size: number;
  failed: boolean;
  onFail: () => void;
}) {
  if (failed) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--color-brand-orange)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.45,
          flexShrink: 0,
        }}
      >
        {MOOD_PLACEHOLDER_EMOJI[mood]}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MOOD_SRC[mood]}
      alt=""
      style={{ width: size, display: "block" }}
      onError={onFail}
    />
  );
}

export default function Elie() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [failedMoods, setFailedMoods] = useState<Record<Mood, boolean>>({
    waiting: false,
    thinking: false,
    answered: false,
  });

  useEffect(() => setMounted(true), []);

  const activeNode = activeId ? QA_TREE[activeId] : null;
  const fullText = activeNode ? activeNode.answer : customAnswer;
  const words = fullText ? fullText.split(" ") : [];

  const mood: Mood = loading ? "thinking" : activeNode || customAnswer ? "answered" : "waiting";

  function markFailed(m: Mood) {
    setFailedMoods((prev) => ({ ...prev, [m]: true }));
  }

  useEffect(() => {
    if (!fullText) {
      setVisibleWordCount(0);
      return;
    }
    let i = 0;
    setVisibleWordCount(0);
    const interval = setInterval(() => {
      i++;
      setVisibleWordCount(i);
      if (i >= words.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNode, customAnswer]);

  function ask(id: string) {
    setActiveId(id);
    setCustomAnswer(null);
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 500); // matches elieModalFall's duration below
  }

  function reset() {
    setOpen(true);
    setActiveId(null);
    setCustomAnswer(null);
    setCustomQuestion("");
    setLoading(false);
  }

  async function askCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;

    setActiveId(null);
    setCustomAnswer(null);
    setLoading(true);

    const MIN_LOADING_MS = 900;
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/elie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: customQuestion }),
      });
      const data = await res.json();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setCustomAnswer(
        res.ok ? data.answer : "Something went wrong on my end — try again in a moment."
      );
    } catch {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setCustomAnswer("Something went wrong on my end — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const questionList = activeNode ? activeNode.followUps : ROOT_QUESTIONS;

  const modal = open && (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "1.5rem",
        // .sara-float-nav sits at bottom: 24px with ~50-60px of its own
        // height, so this lands the modal's bottom edge roughly 20-50px
        // above it. Nudge this number directly if the gap looks off —
        // I can't measure the nav's actual rendered height from here.
        paddingBottom: 100,
        opacity: closing ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: closing ? "none" : "auto",
      }}
    >
      <div
        key={mood}
        className="elie-modal-character"
        style={{ marginBottom: 16, pointerEvents: "none" }}
      >
        <MoodArt
          mood={mood}
          size={140}
          failed={failedMoods[mood]}
          onFail={() => markFailed(mood)}
        />
      </div>

      <div
        className={`elie-modal-card${closing ? " elie-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          maxWidth: 480,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--color-text)",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            float: "right",
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--color-text-muted)",
          }}
        >
          ×
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: "1.25rem" }}>
          Hello, I&apos;m Elie. What would you like to know about Sara?
        </h2>

        {!loading && (activeNode || customAnswer) && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {words.slice(0, visibleWordCount).map((word, i) => (
                <span key={i} className="elie-word">
                  {word}
                </span>
              ))}
            </p>
            <button
              onClick={() => {
                setActiveId(null);
                setCustomAnswer(null);
              }}
              style={{
                marginTop: "0.75rem",
                background: "none",
                border: "none",
                color: "var(--color-brand-orange)",
                cursor: "pointer",
                padding: 0,
                fontSize: 14,
              }}
            >
              ← Back to start
            </button>
          </div>
        )}

        {!loading && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-light-muted)",
                marginBottom: "0.5rem",
              }}
            >
              {activeNode ? "Keep going" : "Suggested questions"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {questionList.map((id) => (
                <button
                  key={id}
                  onClick={() => ask(id)}
                  style={{
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    color: "var(--color-brand-orange)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                  }}
                >
                  {QA_TREE[id].question}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={askCustom}>
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask me about Sara"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "var(--color-text-muted)",
            }}
          />
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={reset}
        aria-label="Ask Elie about Sara"
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          opacity: open ? 0 : 1,
          transform: open ? "translateY(-10px) scale(0.7)" : "translateY(0) scale(1)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: open ? "none" : "auto",
        }}
      >
        <MoodArt
          mood="waiting"
          size={56}
          failed={failedMoods.waiting}
          onFail={() => markFailed("waiting")}
        />
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
