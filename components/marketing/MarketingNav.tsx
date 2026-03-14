"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FactticLogo from "@/components/ui/FactticLogo";

const productDropdown = [
  { href: "/#system-overview", label: "Architecture", desc: "System design & control plane" },
  { href: "/#security", label: "Security", desc: "Cryptographic audit & isolation" },
  { href: "/#compliance", label: "Compliance", desc: "SOC2, GDPR, HIPAA frameworks" },
  { href: "/#governance", label: "Governance Layers", desc: "Semantic policy enforcement" },
];

const resourcesDropdown = [
  { href: "/docs", label: "Documentation", desc: "API reference & integration guides" },
  { href: "/docs#user-guide", label: "User Guide", desc: "Getting started with Facttic.AI" },
  { href: "/blog", label: "Blog", desc: "Research, updates & insights" },
  { href: "/faq", label: "FAQ", desc: "Common questions & answers" },
];

function Dropdown({
  label,
  items,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  items: { href: string; label: string; desc: string }[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: isOpen ? "#C9A84C" : "var(--text-secondary)",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
        aria-expanded={isOpen}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -6px) rotate(45deg)", width: 12, height: 12, background: "var(--surface-2)", borderTop: "1px solid var(--border-subtle)", borderLeft: "1px solid var(--border-subtle)", zIndex: 10 }} />
          <div style={{ position: "relative", background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ padding: 6 }}>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
                  className="hover:bg-[var(--surface-1)] group"
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }} className="group-hover:text-[#C9A84C] transition-colors">
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: "var(--text-muted)" }}>
                    {item.desc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md backdrop-saturate-150"
      style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80 transition-opacity flex items-center">
          <FactticLogo variant="horizontal" theme="auto" width={140} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Dropdown
            label="Platform"
            items={productDropdown}
            isOpen={open === "platform"}
            onOpen={() => setOpen("platform")}
            onClose={() => setOpen(null)}
          />
          <Dropdown
            label="Resources"
            items={resourcesDropdown}
            isOpen={open === "resources"}
            onOpen={() => setOpen("resources")}
            onClose={() => setOpen(null)}
          />
          <Link
            href="/pricing"
            style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.15s", color: isActive("/pricing") ? "#C9A84C" : "var(--text-secondary)" }}
            onMouseEnter={e => { if (!isActive("/pricing")) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { if (!isActive("/pricing")) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.15s", color: isActive("/blog") ? "#C9A84C" : "var(--text-secondary)" }}
            onMouseEnter={e => { if (!isActive("/blog")) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { if (!isActive("/blog")) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Blog
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            style={{ background: "#C9A84C", color: "#0A1628", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "8px 20px", textDecoration: "none", transition: "opacity 0.15s" }}
            className="hover:opacity-90"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
