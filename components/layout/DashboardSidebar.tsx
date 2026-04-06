"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, planAllows, PlanTier } from "@/config/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  isOpen?: boolean;
  close?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SignalIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="7" width="28" height="4" fill="#2563EB" />
      <rect x="4" y="16" width="20" height="4" fill="rgba(255,255,255,0.65)" />
      <rect x="26" y="16" width="6" height="4" fill="rgba(37,99,235,0.85)" />
      <rect x="4" y="25" width="13" height="4" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

const PLAN_BADGE_LABEL: Record<string, string> = {
  growth: 'GROWTH',
  scale:  'SCALE',
};

const PLAN_BADGE_COLOR: Record<string, string> = {
  growth: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  scale:  'text-amber-400  bg-amber-500/10  border-amber-500/20',
};

export default function DashboardSidebar({ isOpen = false, close, collapsed = false, onToggleCollapse }: Props) {
  const pathname = usePathname();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('starter');

  useEffect(() => {
    fetch('/api/dashboard/billing/plan')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.plan?.tier) setCurrentPlan(data.plan.tier as PlanTier);
      })
      .catch(() => {/* stay on starter fallback */});
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const sidebarW = collapsed ? "md:w-14" : "md:w-64";

  return (
    <aside className={`fixed md:relative z-50 h-full ${sidebarW} w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col shrink-0 transition-all duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-[var(--border-primary)] ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}>
        <SignalIcon size={collapsed ? 22 : 20} />
        {!collapsed && (
          <span className="font-semibold tracking-tight text-[var(--text-primary)] text-[15px]" style={{ letterSpacing: "-0.03em" }}>
            Facttic
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!collapsed && (
              <h4 className="px-3 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
                {group.group}
              </h4>
            )}
            {collapsed && <div className="mx-2 h-px bg-[var(--border-primary)] mb-1.5" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

                const allowed = planAllows(currentPlan, item.minPlan);
                const Icon = item.icon;
                const badgeLabel = item.minPlan ? PLAN_BADGE_LABEL[item.minPlan] : null;
                const badgeColor = item.minPlan ? PLAN_BADGE_COLOR[item.minPlan] : '';

                const baseClass = `group flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                }`;

                if (!allowed) {
                  return (
                    <li key={item.href}>
                      <Link
                        id={item.id}
                        href="/dashboard/billing"
                        onClick={() => close?.()}
                        title={collapsed ? `${item.label} — ${badgeLabel} plan required` : undefined}
                        className={`${baseClass} text-[var(--text-secondary)]/40 hover:bg-[var(--bg-primary)] hover:text-[var(--text-secondary)]/60`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-40" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                            <Lock className="w-3 h-3 opacity-40 shrink-0" />
                          </>
                        )}
                        {collapsed && <Lock className="w-2.5 h-2.5 opacity-40 absolute bottom-1 right-1" />}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      id={item.id}
                      href={item.href}
                      onClick={() => close?.()}
                      title={collapsed ? item.label : undefined}
                      className={`${baseClass} ${
                        isActive
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
                      {!collapsed && item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Plan badge in footer */}
      {!collapsed && (
        <div className="px-3 pb-1">
          <Link
            href="/dashboard/billing"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)]/40 transition-all"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Plan</span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
              currentPlan === 'scale'  ? PLAN_BADGE_COLOR.scale  :
              currentPlan === 'growth' ? PLAN_BADGE_COLOR.growth :
              'text-[var(--text-secondary)] bg-white/5 border-white/10'
            }`}>
              {currentPlan === 'starter' ? 'STARTER' : currentPlan === 'growth' ? 'GROWTH' : 'SCALE'}
            </span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--border-primary)] p-3 flex flex-col gap-2">
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full py-2 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          {!collapsed && <span className="ml-2 text-[9px] font-black uppercase tracking-widest">Collapse</span>}
        </button>

        <button
          onClick={handleSignOut}
          className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all ${collapsed ? "justify-center" : "justify-center w-full"}`}
          title={collapsed ? "Sign Out" : undefined}
        >
          {!collapsed && "Sign Out"}
          {collapsed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
