"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useDashboardData } from "./useDashboardData";
import { DashboardData } from "./types";

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const stats = useDashboardData("/api/dashboard/stats");

  return (
    <DashboardContext.Provider value={stats}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardStats() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardStats must be used within a DashboardProvider");
  }
  return context;
}
