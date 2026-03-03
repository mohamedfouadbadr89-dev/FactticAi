import React from "react";
import EnterpriseTopbar from "@/components/layout/EnterpriseTopbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card-bg)] border-r border-[var(--border-color)] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] font-bold">
          Facttic.AI
        </div>

        <nav className="flex-1 p-6 space-y-4 text-sm">
          <div className="font-medium text-[var(--text-primary)]">Dashboard</div>
          <div className="text-[var(--text-secondary)]">Alerts</div>
          <div className="text-[var(--text-secondary)]">Investigations</div>
          <div className="text-[var(--text-secondary)]">Compliance</div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <EnterpriseTopbar />

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}