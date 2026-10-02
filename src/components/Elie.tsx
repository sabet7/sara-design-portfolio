"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QA_TREE, ROOT_QUESTIONS } from "@/lib/elieQA";

type Mood = "waiting" | "thinking" | "answered";

type Message = {
  id: number;
  role: "user" | "elie";
  text: string;
};

// Elie's mood animations, shown ABOVE the modal card. Waiting and answered
// art aren't uploaded yet — MoodArt falls back to a simple placeholder per
// mood until each file exists at these exact paths, no code changes needed.
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

// The navbar trigger icon — static, not part of the mood system.
const ELIE_ICON_SRC = "/media/elie/elie-icon.webp";

// Sara's profile photo, shown in the circle on the About view.
// Falls back to a plain gray circle until the file exists at this path.
const PROFILE_SRC = "/media/elie/sara-profile.webp";

// About Me copy — edit here without touching the layout below.
const ABOUT_HEADLINE =
  "I'm a designer who simplifies complex ideas and transforms them into impactful experiences.";
const ABOUT_BODY =
  "I think about the relationship and impact between humans and technology, seeing how they work together at a larger scale and also 1 to 1. Currently, I'm building an app aimed at helping students create study habits.";
const ABOUT_INTERESTS_INTRO = "When I'm not designing or working on my app, I am:";
const ABOUT_INTERESTS = ["helping small businesses", "indoor gardening", "baking"];

// Set to false to hide follow-up question suggestions in the chat view.
const SHOW_FOLLOW_UPS = true;

const ERROR_TEXT = "Something went wrong on my end — try again in a moment.";
const ELIE_BUBBLE_BG = "#F2F2F2";
const AVATAR_SIZE = 120;

// Elie animation size and the fixed slot it sits in above the card.
// The slot keeps a constant height so the card never shifts between moods.
const MOOD_SIZE = 96;
const MOOD_SLOT_HEIGHT = 110;

// Fixed card height — identical in the About view and the chat view.
const CARD_HEIGHT = "min(560px, 70vh)";

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
      className="elie-mood-art-img"
      style={{
        width: size,
        height: size,
        maxWidth: size,
        maxHeight: size,
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
      }}
      onError={onFail}
    />
  );
}

function ProfileCircle({
  size,
  failed,
  onFail,
}: {
  size: number;
  failed: boolean;
  onFail: () => void;
}) {
  if (failed) {
    return (
      <div
        aria-hidden="true"
        style={{ width: size, height: size, borderRadius: "50%", background: "#D9D9D9" }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PROFILE_SRC}
      alt="Sara Del Villar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        background: "#D9D9D9",
      }}
      onError={onFail}
    />
  );
}

function SendIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4l16 8-16 8 3-8-3-8z" />
      <path d="M7 12h13" />
    </svg>
  );
}

function TypingBubble() {
  return (
    <div
      aria-label="Elie is typing"
      style={{
        alignSelf: "flex-start",
        background: ELIE_BUBBLE_BG,
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className="elie-typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function Elie() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastNodeId, setLastNodeId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const [profileFailed, setProfileFailed] = useState(false);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [failedMoods, setFailedMoods] = useState<Record<Mood, boolean>>({
    waiting: false,
    thinking: false,
    answered: false,
  });

  const nextId = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const inChat = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const mood: Mood = loading ? "thinking" : lastMessage?.role === "elie" ? "answered" : "waiting";

  function markFailed(m: Mood) {
    setFailedMoods((prev) => ({ ...prev, [m]: true }));
  }

  function addMessage(role: Message["role"], text: string) {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { id, role, text }]);
    return id;
  }

  function addElieAnswer(text: string) {
    const id = addMessage("elie", text);
    setTypingId(id);
  }

  // Word-by-word reveal for the newest Elie message only.
  useEffect(() => {
    if (typingId === null) return;
    const msg = messages.find((m) => m.id === typingId);
    if (!msg) return;
    const total = msg.text.split(" ").length;
    let i = 0;
    setVisibleWordCount(0);
    const interval = setInterval(() => {
      i++;
      setVisibleWordCount(i);
      if (i >= total) {
        clearInterval(interval);
        setTypingId(null);
      }
    }, 70);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingId]);

  // Keep the thread scrolled to the newest message. Scrolls ONLY the
  // thread container, never the card or the page.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, visibleWordCount]);

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function ask(id: string) {
    if (loading) return;
    const node = QA_TREE[id];
    addMessage("user", node.question);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastNodeId(id);
      addElieAnswer(node.answer);
    }, 700); // brief thinking beat before revealing the canned answer
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 500); // matches elieModalFall's duration
  }

  function reset() {
    setOpen(true);
    setMessages([]);
    setLastNodeId(null);
    setCustomQuestion("");
    setLoading(false);
    setTypingId(null);
    setVisibleWordCount(0);
  }

  async function askCustom(e: React.FormEvent) {
    e.preventDefault();
    const question = customQuestion.trim();
    if (!question || loading) return;

    addMessage("user", question);
    setCustomQuestion("");
    setLastNodeId(null);
    setLoading(true);

    const MIN_LOADING_MS = 900;
    const startedAt = Date.now();
    let answer = ERROR_TEXT;

    try {
      const res = await fetch("/api/elie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok) answer = data.answer;
    } catch {
      // keep ERROR_TEXT
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    setLoading(false);
    addElieAnswer(answer);
  }

  const followUps =
    SHOW_FOLLOW_UPS && lastNodeId && !loading && typingId === null
      ? QA_TREE[lastNodeId].followUps
      : [];

  const questionButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    textAlign: "left",
    color: "var(--color-brand-orange)",
    cursor: "pointer",
    padding: 0,
    fontSize: 15,
  };

  // Shared scroll area — both views fill the same space above the input.
  const scrollAreaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    marginBottom: "1.25rem",
    paddingRight: 4,
  };

  const aboutView = (
    <div style={scrollAreaStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "1.75rem",
        }}
      >
        <ProfileCircle
          size={AVATAR_SIZE}
          failed={profileFailed}
          onFail={() => setProfileFailed(true)}
        />
        <span
          style={{
            marginTop: -22,
            position: "relative",
            background: "#fff",
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 17,
            fontWeight: 500,
            color: "var(--color-text)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          About Me
        </span>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, marginBottom: "0.75rem" }}>
          {ABOUT_HEADLINE}
        </p>
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
          {ABOUT_BODY}
        </p>
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "0.4rem" }}>
          {ABOUT_INTERESTS_INTRO}
        </p>
        <ul
          style={{
            listStyle: "disc",
            paddingLeft: "1.5rem",
            margin: 0,
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          {ABOUT_INTERESTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={{ paddingLeft: "0.75rem" }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: "0.85rem" }}>
          What would you like to know?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: "1rem" }}>
          {ROOT_QUESTIONS.map((id) => (
            <button key={id} onClick={() => ask(id)} style={questionButtonStyle}>
              {QA_TREE[id].question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const chatView = (
    <div
      ref={threadRef}
      style={{
        ...scrollAreaStyle,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingTop: "0.5rem",
      }}
    >
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const text =
          msg.id === typingId
            ? msg.text.split(" ").slice(0, visibleWordCount).join(" ")
            : msg.text;
        return (
          <div
            key={msg.id}
            style={{
              alignSelf: isUser ? "flex-end" : "flex-start",
              maxWidth: isUser ? "75%" : "70%",
              flexShrink: 0,
              background: isUser ? "var(--color-brand-orange)" : ELIE_BUBBLE_BG,
              color: "var(--color-text)",
              fontWeight: isUser ? 500 : 400,
              fontSize: 17,
              lineHeight: 1.5,
              borderRadius: 14,
              padding: isUser ? "12px 20px" : "14px 20px",
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </div>
        );
      })}

      {loading && <TypingBubble />}

      {followUps.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingLeft: "0.25rem",
            flexShrink: 0,
          }}
        >
          {followUps.map((id) => (
            <button key={id} onClick={() => ask(id)} style={questionButtonStyle}>
              {QA_TREE[id].question}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const modal = open && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask Elie about Sara"
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
        // Lands the modal's bottom edge above the floating nav.
        // Nudge this number if the gap looks off.
        paddingBottom: 100,
        opacity: closing ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: closing ? "none" : "auto",
      }}
    >
      <style>{`
        .elie-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-text-muted);
          display: inline-block;
          animation: elieTypingBounce 1s infinite ease-in-out;
        }
        @keyframes elieTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* Elie's mood animation — fixed-height slot directly above the card */}
      <div
        style={{
          height: MOOD_SLOT_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
          pointerEvents: "none",
          flexShrink: 0,
        }}
      >
        <div key={mood} className="elie-modal-character">
          <MoodArt
            mood={mood}
            size={MOOD_SIZE}
            failed={failedMoods[mood]}
            onFail={() => markFailed(mood)}
          />
        </div>
      </div>

      <div
        className={`elie-modal-card${closing ? " elie-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 24,
          padding: "2.25rem 2.25rem 2rem",
          maxWidth: 720,
          width: "100%",
          height: CARD_HEIGHT,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--color-text)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            background: "none",
            border: "none",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            color: "var(--color-text-muted)",
            zIndex: 1,
          }}
        >
          ×
        </button>

        {inChat ? chatView : aboutView}

        <form onSubmit={askCustom} style={{ position: "relative", flexShrink: 0 }}>
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask me about Sara"
            disabled={loading}
            aria-label="Ask a question about Sara"
            style={{
              width: "100%",
              padding: "20px 60px 20px 20px",
              borderRadius: 16,
              border: "1px solid #9A9A9A",
              fontSize: 18,
              color: "var(--color-text)",
              background: "#fff",
              outline: "none",
            }}
          />
          <button
            type="submit"
            aria-label="Send question"
            disabled={loading || !customQuestion.trim()}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              padding: 6,
              display: "flex",
              cursor: loading || !customQuestion.trim() ? "default" : "pointer",
              color: customQuestion.trim()
                ? "var(--color-brand-orange)"
                : "var(--color-text-muted)",
              transition: "color 0.2s ease",
            }}
          >
            <SendIcon />
          </button>
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
          position: "relative",
          zIndex: 40,
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
        {iconFailed ? (
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-brand-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              flexShrink: 0,
            }}
          >
            ✨
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ELIE_ICON_SRC}
            alt=""
            style={{ width: 56, height: 56, display: "block" }}
            onError={() => setIconFailed(true)}
          />
        )}
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
