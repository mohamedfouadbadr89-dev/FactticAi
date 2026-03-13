"use client";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import EnterpriseTopbar from "@/components/layout/EnterpriseTopbar";
import { SimulationProvider } from "@/lib/dashboard/SimulationContext";
import OnboardingTour from "@/components/ui/OnboardingTour";
import UserFeedbackWidget from "@/components/ui/UserFeedbackWidget";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useState, useEffect, useRef } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (syncAttempted.current) return;
    syncAttempted.current = true;

    fetch('/api/dashboard/stats').then(res => {
      if (res.status === 401) {
        fetch('/api/setup/sync-user', { method: 'POST' })
          .then(r => { if (r.ok) window.location.reload(); })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <SimulationProvider>
      <OnboardingTour />
      <UserFeedbackWidget />
      <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
        <DashboardSidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <EnterpriseTopbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Breadcrumbs />
          <main className="flex-1 overflow-y-auto w-full relative">
            {children}
          </main>
        </div>
      </div>
    </SimulationProvider>
  );
}