"use client";

import { useEffect, useState } from "react";

interface Section {
  label: string;
  id: string;
}

export default function DetailSidebar({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <nav className="detail-sidebar">
      {sections.map(({ label, id }) => ( 
          <a key={id}
          href={`#${id}`}
          onClick={(e) => handleClick(e, id)}
          className={active === id ? "active" : ""}>
          {label}
        </a>
      ))}
    </nav>
  );
}
