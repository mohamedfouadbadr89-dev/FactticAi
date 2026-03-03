"use client";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import EnterpriseTopbar from "@/components/layout/EnterpriseTopbar";
import { SimulationProvider } from "@/lib/dashboard/SimulationContext";
import OnboardingTour from "@/components/ui/OnboardingTour";
import UserFeedbackWidget from "@/components/ui/UserFeedbackWidget";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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