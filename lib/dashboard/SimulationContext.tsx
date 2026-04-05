"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface SimulationState {
  isSimulating: boolean;
  simulationStep: number;
}

interface SimulationActions {
  startSimulation: () => void;
  resetSimulation: () => void;
}

const SimulationStateContext = createContext<SimulationState | undefined>(undefined);
const SimulationActionsContext = createContext<SimulationActions | undefined>(undefined);

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
    <SimulationStateContext.Provider value={{ isSimulating, simulationStep }}>
      <SimulationActionsContext.Provider value={{ startSimulation, resetSimulation }}>
        {children}
      </SimulationActionsContext.Provider>
    </SimulationStateContext.Provider>
  );
}

export function useSimulation() {
  const state = useContext(SimulationStateContext);
  const actions = useContext(SimulationActionsContext);
  
  if (state === undefined || actions === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  
  return { ...state, ...actions };
}

export function useSimulationActions() {
  const actions = useContext(SimulationActionsContext);
  if (actions === undefined) {
    throw new Error("useSimulationActions must be used within a SimulationProvider");
  }
  return actions;
}

export function useSimulationState() {
  const state = useContext(SimulationStateContext);
  if (state === undefined) {
    throw new Error("useSimulationState must be used within a SimulationProvider");
  }
  return state;
}
