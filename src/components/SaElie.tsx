"use client";

import { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "Tell me about your design process.",
  "What does design thinking mean to you?",
  "How do you approach product strategy?",
  "How do you approach new projects? Where do you start?",
] as const;

const PLACEHOLDER_ANSWERS: Record<string, string> = {
  "Tell me about your design process.":
    "[Placeholder — Sara's real answer goes here.]",
  "What does design thinking mean to you?":
    "[Placeholder — Sara's real answer goes here.]",
  "How do you approach product strategy?":
    "[Placeholder — Sara's real answer goes here.]",
  "How do you approach new projects? Where do you start?":
    "[Placeholder — Sara's real answer goes here.]",
};

export default function SaElie() {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");

  function askSuggested(q: string) {
    setAnswer(PLACEHOLDER_ANSWERS[q]);
  }

  function askCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setAnswer(
      "[Not connected yet — open questions will be answered by Claude once the API route is set up.]"
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setAnswer(null);
          setCustomQuestion("");
        }}
        aria-label="Ask Sa Elie about Sara"
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
              Hello, I&apos;m Sa Elie. What would you like to know about Sara?
            </h2>

            {answer ? (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {answer}
                </p>
                <button
                  onClick={() => setAnswer(null)}
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
                  ← Ask something else
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-light-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Suggested questions
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => askSuggested(q)}
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
                      {q}
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
