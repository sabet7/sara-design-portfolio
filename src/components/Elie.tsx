"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QA_TREE, ROOT_QUESTIONS } from "@/lib/elieQA";

export default function Elie() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [thinkingImgFailed, setThinkingImgFailed] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeNode = activeId ? QA_TREE[activeId] : null;
  const fullText = activeNode ? activeNode.answer : customAnswer;
  const words = fullText ? fullText.split(" ") : [];

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

  function reset() {
    setOpen(true);
    setActiveId(null);
    setCustomAnswer(null);
    setCustomQuestion("");
    setLoading(false);
    setThinkingImgFailed(false);
  }

  async function askCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;

    setActiveId(null);
    setCustomAnswer(null);
    setLoading(true);

    try {
      const res = await fetch("/api/elie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: customQuestion }),
      });
      const data = await res.json();
      setCustomAnswer(
        res.ok ? data.answer : "Something went wrong on my end — try again in a moment."
      );
    } catch {
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
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      {loading && (
        <div style={{ marginBottom: "16px", pointerEvents: "none" }}>
          {!thinkingImgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/media/elie/elie-thinking.webp"
              alt=""
              style={{ width: 160, display: "block" }}
              onError={() => setThinkingImgFailed(true)}
            />
          ) : (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0" }}>
              <span className="elie-thinking-dot" style={{ animationDelay: "0s" }} />
              <span className="elie-thinking-dot" style={{ animationDelay: "0.15s" }} />
              <span className="elie-thinking-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          )}
        </div>
      )}

      <div
        className="elie-modal-card"
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
          onClick={() => setOpen(false)}
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
                  {word}{" "}
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
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-brand-orange)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        ✨
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
