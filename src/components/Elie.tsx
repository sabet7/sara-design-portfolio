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

// Sara's profile photo, shown in the circle on the About view.
// Falls back to a plain gray circle until the file exists at this path.
const PROFILE_SRC_CANDIDATES = [
  "/media/elie/sara-profile.jpg",
  "/media/elie/sara-profile.jpeg",
  "/media/elie/sara-profile.JPG",
  "/media/elie/sara-profile.png",
  "/media/elie/sara-profile.webp",
];

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

// Elie's mood animation now sits INSIDE the card, in its top-left corner.
// MOOD_SIZE is its width/height in px; MOOD_POS is its distance from the
// card's top and left edges. The chat thread starts below it (see
// CHAT_TOP_PADDING) so messages never sit underneath it at first.
const MOOD_SIZE = 56;
const MOOD_POS = { top: 18, left: 22 };
const CHAT_TOP_PADDING = "2.4rem";

// Fixed card height — identical in the About view and the chat view.
// Was min(560px, 70vh) — smaller cap so there's guaranteed room left over
// above it for the mood slot + top padding on a typical laptop-height
// viewport, not just a tall monitor.
const CARD_HEIGHT = "min(500px, 62vh)";

// Open/close behaves like a bottom sheet: the panel starts as the exact
// size and position of the floating nav pill, then grows upward from that
// anchor to PANEL_WIDTH x CARD_HEIGHT (and shrinks back on close).
const PANEL_WIDTH = "min(720px, calc(100vw - 2rem))";
const SHEET_MS = 620; // keep in sync with the transitions in SHEET_CSS
const DRAG_CLOSE_PX = 90; // drag the handle down this far to close

const SHEET_CSS = `
.elie-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9490;
  background: rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  opacity: 0;
  transition: opacity 0.5s ease;
}
.elie-backdrop[data-expanded="true"] { opacity: 1; }

.elie-sheet-wrap {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 9500;
  box-sizing: border-box;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.elie-sheet {
  --sheet-from: rgba(255, 255, 255, 0.86);
  --sheet-border: rgba(255, 255, 255, 0.65);
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: auto;
  background: var(--sheet-from);
  border: 1px solid var(--sheet-border);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.16);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  backdrop-filter: blur(34px) saturate(180%);
  color: var(--color-text);
  transition:
    width ${SHEET_MS}ms cubic-bezier(0.32, 0.72, 0, 1),
    height ${SHEET_MS}ms cubic-bezier(0.32, 0.72, 0, 1),
    border-radius ${SHEET_MS}ms cubic-bezier(0.32, 0.72, 0, 1),
    background 0.45s ease,
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
:root[data-dimmer-stage="charcoal"] .elie-sheet,
:root[data-dimmer-stage="near-black"] .elie-sheet {
  --sheet-from: rgba(20, 20, 20, 0.86);
  --sheet-border: rgba(255, 255, 255, 0.2);
}
.elie-sheet[data-expanded="true"] { background: #fff; }

/* Content is laid out at its final size and anchored to the bottom, so the
   growing panel reveals it instead of squeezing it. It fades in once the
   panel is mostly open and fades out first on close. */
.elie-sheet-inner {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: calc(${PANEL_WIDTH} - 2px);
  height: calc(${CARD_HEIGHT} - 2px);
  display: flex;
  flex-direction: column;
  padding: 2.25rem 2.25rem 2rem;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.elie-sheet[data-expanded="true"] .elie-sheet-inner {
  opacity: 1;
  transition: opacity 0.35s ease 0.24s;
}

.elie-handle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  z-index: 2;
}
.elie-handle:active { cursor: grabbing; }
.elie-handle span {
  display: block;
  width: 40px;
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
}

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

@media (prefers-reduced-motion: reduce) {
  .elie-sheet, .elie-backdrop, .elie-sheet-inner { transition-duration: 0.01ms !important; transition-delay: 0s !important; }
}
`;

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
        filter: "none",
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
  // Tries each filename in PROFILE_SRC_CANDIDATES in order and only falls
  // back to the gray circle if none of them load, so a .jpg/.jpeg/.png
  // mismatch can't leave the circle empty.
  const [candidate, setCandidate] = useState(0);

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
      key={PROFILE_SRC_CANDIDATES[candidate]}
      src={PROFILE_SRC_CANDIDATES[candidate]}
      alt="Sara Del Villar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        background: "#D9D9D9",
      }}
      onError={() => {
        if (candidate < PROFILE_SRC_CANDIDATES.length - 1) {
          setCandidate(candidate + 1);
        } else {
          onFail();
        }
      }}
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
  const [expanded, setExpanded] = useState(false);
  const [start, setStart] = useState({ w: 260, h: 48, bottom: 24 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastNodeId, setLastNodeId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ startY: number; dy: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Page behind the sheet doesn't scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Once the sheet has finished opening, focus the question box (skipped on
  // touch devices so the keyboard doesn't cover the sheet right away).
  useEffect(() => {
    if (!expanded) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), SHEET_MS - 80);
    return () => clearTimeout(t);
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

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
    if (closeTimer.current) return; // already closing
    setExpanded(false);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, SHEET_MS);
  }

  // Drag the handle down to close, like a bottom sheet.
  function onHandleDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }
  function onHandleMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !sheetRef.current) return;
    drag.dy = Math.max(0, e.clientY - drag.startY);
    sheetRef.current.style.transform = `translateY(${drag.dy}px)`;
  }
  function onHandleUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    const sheet = sheetRef.current;
    if (!drag || !sheet) return;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (drag.dy > DRAG_CLOSE_PX) handleClose();
  }

  function reset() {
    // Measure the nav pill so the sheet can start exactly on top of it.
    const nav = triggerRef.current?.closest(".sara-float-nav") as HTMLElement | null;
    if (nav) {
      const r = nav.getBoundingClientRect();
      setStart({ w: r.width, h: r.height, bottom: Math.max(0, window.innerHeight - r.bottom) });
    }
    setExpanded(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
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
          // Space above the photo circle (change this to adjust it).
          paddingTop: "1.75rem",
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
        paddingTop: CHAT_TOP_PADDING,
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
    <>
      <style>{SHEET_CSS}</style>
      <div
        className="elie-backdrop"
        data-expanded={expanded}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="elie-sheet-wrap"
        role="dialog"
        aria-modal="true"
        aria-label="About Sara"
        style={{ bottom: start.bottom }}
      >
        <div
          ref={sheetRef}
          className="elie-sheet"
          data-expanded={expanded}
          style={
            expanded
              ? { width: PANEL_WIDTH, height: CARD_HEIGHT, borderRadius: 24 }
              : { width: start.w, height: start.h, borderRadius: start.h / 2 }
          }
        >
          <div className="elie-sheet-inner">
            <div
              className="elie-handle"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              aria-hidden="true"
            >
              <span />
            </div>

            {/* Elie's mood animation, inside the card (top-left). Mounted
                once the sheet is opening so its drop-in plays then. */}
            {expanded && (
              <div
                key={mood}
                className="elie-modal-character"
                style={{
                  position: "absolute",
                  top: MOOD_POS.top,
                  left: MOOD_POS.left,
                  zIndex: 2,
                  pointerEvents: "none",
                  animationDelay: "0.25s",
                  animationFillMode: "both",
                }}
              >
                <MoodArt
                  mood={mood}
                  size={MOOD_SIZE}
                  failed={failedMoods[mood]}
                  onFail={() => markFailed(mood)}
                />
              </div>
            )}

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
                zIndex: 3,
              }}
            >
              ×
            </button>

            {inChat ? chatView : aboutView}

            <form onSubmit={askCustom} style={{ position: "relative", flexShrink: 0 }}>
              <input
                ref={inputRef}
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
      </div>
    </>
  );

  return (
    <>
      {/* Plain text nav item, same style as "Works" and "Fun". It opens
          the About panel instead of switching the filter. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={reset}
        aria-haspopup="dialog"
        className="float-nav-item"
        style={{
          opacity: open ? 0 : 1,
          transition: "opacity 0.2s ease, background 0.2s ease, color 0.2s ease, font-weight 0.2s ease",
          pointerEvents: open ? "none" : "auto",
        }}
      >
        About
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
