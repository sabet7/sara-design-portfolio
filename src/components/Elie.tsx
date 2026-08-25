"use client";

import { useState } from "react";
import { QA_TREE, ROOT_QUESTIONS } from "@/lib/elieQA";

export default function Elie() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeNode = activeId ? QA_TREE[activeId] : null;

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

  return (
    <>
      <button
        onClick={reset}
        aria-label="Ask Elie about Sara"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "1.5rem",
          zIndex: 50,
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-brand-orange)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          fontSize: 20,
        }}
      >
        ✨
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
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

            {loading && (
              <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                Thinking…
              </p>
            )}

            {!loading && (activeNode || customAnswer) && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {activeNode ? activeNode.answer : customAnswer}
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
      )}
    </>
  );
}
