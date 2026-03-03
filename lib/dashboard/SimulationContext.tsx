"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface SimulationContextType {
  isSimulating: boolean;
  simulationStep: number;
  startSimulation: () => void;
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
    setSimulationStep(0);
  }, []);

  const startSimulation = useCallback(() => {
    resetSimulation();
    setIsSimulating(true);
    
    // Immediately move to step 1
    setSimulationStep(1);
    
    // Advance steps every 3 seconds up to step 4
    let currentStep = 1;
    timerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= 4) {
        setSimulationStep(currentStep);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 3000);
  }, [resetSimulation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <SimulationContext.Provider value={{ isSimulating, simulationStep, startSimulation, resetSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
