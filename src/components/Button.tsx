import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  fontSize?: number;
}

export default function Button({ children, href, onClick, icon, fontSize = 14 }: ButtonProps) {
  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "var(--color-brand-orange)",
    color: "var(--color-text)",
    fontWeight: 700,
    fontSize,
    padding: "8px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
  };

  if (href) {
    return (
      <a href={href} style={pillStyle}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={pillStyle}>
      {icon}
      {children}
    </button>
  );
}

export function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
