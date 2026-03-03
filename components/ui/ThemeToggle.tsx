"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "facttic-theme";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light") {
      setTheme("light");
      document.documentElement.classList.remove("theme-dark");
      document.documentElement.classList.add("theme-light");
    } else {
      // Default: dark
      setTheme("dark");
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("theme-dark");
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");

    if (theme === "dark") {
      html.classList.remove("theme-dark");
      html.classList.add("theme-light");
      localStorage.setItem(STORAGE_KEY, "light");
      setTheme("light");
    } else {
      html.classList.remove("theme-light");
      html.classList.add("theme-dark");
      localStorage.setItem(STORAGE_KEY, "dark");
      setTheme("dark");
    }

    setTimeout(() => html.classList.remove("theme-transitioning"), 200);
  };

  if (!mounted) {
    return <div className="w-8 h-8" aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition-colors"
      aria-label="Toggle Theme"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
