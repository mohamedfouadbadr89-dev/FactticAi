"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "@/config/navigation";
import { createBrowserClient } from '@supabase/ssr';

export default function DashboardSidebar({ isOpen = false, close }: { isOpen?: boolean; close?: () => void }) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className={`fixed md:relative z-50 h-full w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--accent)] text-[var(--bg-primary)] flex items-center justify-center font-black text-xs">
            F
          </div>
          <span className="font-bold tracking-tight text-[var(--text-primary)]">FactticAI</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <h4 className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              {group.group}
            </h4>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      id={item.id}
                      href={item.href}
                      onClick={() => close?.()}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-[var(--border-primary)]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
