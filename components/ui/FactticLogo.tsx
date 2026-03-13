"use client";

import { useEffect, useState } from "react";

interface Props {
  variant?: "horizontal" | "compact" | "icon";
  theme?: "dark" | "light" | "auto";
  width?: number;
  className?: string;
}

export default function FactticLogo({ variant = "horizontal", theme = "auto", width, className = "" }: Props) {
  const [autoTheme, setAutoTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (theme !== "auto") return;
    const update = () => {
      setAutoTheme(document.documentElement.classList.contains("theme-light") ? "light" : "dark");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [theme]);

  const isDark = theme === "auto" ? autoTheme === "dark" : theme === "dark";

  const bar2Fill = isDark ? "rgba(255,255,255,0.65)"  : "rgba(26,26,46,0.65)";
  const bar3Fill = isDark ? "rgba(255,255,255,0.22)"  : "rgba(26,26,46,0.22)";
  const wordmark = isDark ? "#FFFFFF" : "#1A1A2E";
  const divider  = isDark ? "rgba(255,255,255,0.20)"  : "rgba(0,0,0,0.15)";

  /* ── Icon only ───────────────────────────────────────── */
  if (variant === "icon") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 36"
        width={width ?? 36}
        height={width ?? 36}
        className={className}
        fill="none"
      >
        <rect x="4"  y="7"  width="28" height="4" fill="#2563EB" />
        <rect x="4"  y="16" width="20" height="4" fill={bar2Fill} />
        <rect x="26" y="16" width="6"  height="4" fill="#2563EB" opacity="0.85" />
        <rect x="4"  y="25" width="13" height="4" fill={bar3Fill} />
      </svg>
    );
  }

  /* ── Compact (icon stacked above wordmark) ───────────── */
  if (variant === "compact") {
    const w = width ?? 160;
    const h = Math.round(w * 0.6);
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 96"
        width={w}
        height={h}
        className={className}
        fill="none"
      >
        {/* Icon centered — canonical 36×36 scaled 1.5× = 54px wide, centered at x=53 */}
        <g transform="translate(53,4) scale(1.5)">
          <rect x="4"  y="7"  width="28" height="4" fill="#2563EB" />
          <rect x="4"  y="16" width="20" height="4" fill={bar2Fill} />
          <rect x="26" y="16" width="6"  height="4" fill="#2563EB" opacity="0.85" />
          <rect x="4"  y="25" width="13" height="4" fill={bar3Fill} />
        </g>
        <text
          x="80" y="88"
          textAnchor="middle"
          fontFamily="Inter, Poppins, system-ui, sans-serif"
          fontWeight="600"
          fontSize="28"
          letterSpacing="-0.03em"
          fill={wordmark}
        >
          Facttic
        </text>
      </svg>
    );
  }

  /* ── Horizontal (icon | divider | wordmark) ─────────── */
  const w = width ?? 200;
  const h = Math.round(w * (80 / 320));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 80"
      width={w}
      height={h}
      className={className}
      fill="none"
    >
      {/* Signal Stack bars — from canonical spec */}
      <rect x="4"  y="27" width="31" height="8"  fill="#2563EB" />
      <rect x="4"  y="39" width="22" height="7"  fill={bar2Fill} />
      <rect x="28" y="39" width="7"  height="7"  fill="#2563EB" opacity="0.85" />
      <rect x="4"  y="50" width="14" height="7"  fill={bar3Fill} />
      {/* Divider */}
      <line x1="60" y1="18" x2="60" y2="62" stroke={divider} strokeWidth="1" />
      {/* Wordmark */}
      <text
        x="76" y="57"
        fontFamily="Inter, Poppins, system-ui, sans-serif"
        fontWeight="600"
        fontSize="36"
        letterSpacing="-0.03em"
        fill={wordmark}
      >
        Facttic
      </text>
    </svg>
  );
}
