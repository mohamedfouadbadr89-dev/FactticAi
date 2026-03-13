"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "facttic-theme";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    const resolved = saved === "light" ? "light" : "dark";
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  function applyTheme(t: "light" | "dark") {
    const html = document.documentElement;
    if (t === "light") {
      html.classList.remove("theme-dark");
      html.classList.add("theme-light");
    } else {
      html.classList.remove("theme-light");
      html.classList.add("theme-dark");
    }
  }

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");

    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);

    setTimeout(() => html.classList.remove("theme-transitioning"), 250);
  };

  if (!mounted) {
    return <div className="w-8 h-8" aria-hidden="true" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      className="relative w-14 h-7 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] transition-colors flex items-center px-1 shrink-0"
    >
      {/* Track glow in dark mode */}
      <span
        className={`absolute inset-0 rounded-full transition-opacity duration-300 ${isDark ? "opacity-100" : "opacity-0"}`}
        style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
      />

      {/* Thumb */}
      <span
        className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
          isDark
            ? "translate-x-7 bg-[var(--accent)]"
            : "translate-x-0 bg-[var(--surface-0)] border border-[var(--border-primary)]"
        }`}
      >
        {isDark ? (
          /* Moon icon */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M8.5 6.5A4 4 0 113.5 1.5 3 3 0 008.5 6.5z"
              fill="white"
            />
          </svg>
        ) : (
          /* Sun icon */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="2" fill="var(--accent)" />
            <path d="M5 1v1M5 8v1M1 5h1M8 5h1M2.5 2.5l.7.7M6.8 6.8l.7.7M2.5 7.5l.7-.7M6.8 3.2l.7-.7"
              stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
