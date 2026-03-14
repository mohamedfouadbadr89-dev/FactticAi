"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useInteractionMode } from "@/store/interactionMode";

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  type: "chat" | "voice";
  version: string;
  is_active: boolean;
  created_at: string;
}

interface AgentContextValue {
  agents: Agent[];
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent) => void;
  loading: boolean;
  refetch: () => void;
}

const AgentContext = createContext<AgentContextValue>({
  agents: [],
  selectedAgent: null,
  setSelectedAgent: () => {},
  loading: false,
  refetch: () => {},
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgentState] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const { setMode } = useInteractionMode();

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) return;
      const data = await res.json();
      const list: Agent[] = data.agents ?? [];
      setAgents(list);

      // Auto-select first active agent if none selected
      const saved = localStorage.getItem("facttic_selected_agent");
      const found = saved ? list.find(a => a.id === saved) : null;
      const toSelect = found ?? list.find(a => a.is_active) ?? list[0] ?? null;

      if (toSelect) {
        setSelectedAgentState(toSelect);
        setMode(toSelect.type);
      }
    } catch {
      // silently fail — no agents in DB yet
    } finally {
      setLoading(false);
    }
  }, [setMode]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const setSelectedAgent = useCallback((agent: Agent) => {
    setSelectedAgentState(agent);
    setMode(agent.type);
    localStorage.setItem("facttic_selected_agent", agent.id);
  }, [setMode]);

  return (
    <AgentContext.Provider value={{ agents, selectedAgent, setSelectedAgent, loading, refetch: fetchAgents }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
