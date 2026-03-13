import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global Interaction Mode Store
 * 
 * CORE PRINCIPLE: Multi-modal Governance.
 * This store manages the global state of the dashboard interaction mode
 * (Chat vs Voice), which affects how governance tools are presented
 * and how AI connections are configured.
 */

export type InteractionMode = 'chat' | 'voice';

interface InteractionModeState {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
}

export const useInteractionMode = create<InteractionModeState>()(
  persist(
    (set) => ({
      mode: 'chat',
      setMode: (mode: InteractionMode) => set({ mode }),
    }),
    {
      name: 'facttic_interaction_mode',
    }
  )
);
