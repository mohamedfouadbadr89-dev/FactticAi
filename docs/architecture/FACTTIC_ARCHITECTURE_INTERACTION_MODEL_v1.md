# Global Interaction Mode Architecture

Facttic AI supports multi-modal governance, allowing organizations to maintain a unified risk posture across both Text (Chat) and Audio (Voice) interaction channels.

## Core Objective

The **Interaction Mode** system provides a global switch that refocuses the entire dashboard (from configuration wizards to monitoring widgets) on the specific challenges of the active modality.

- **Chat Mode**: Optimized for LLM text streams, JSON payloads, and traditional prompt-completion cycles.
- **Voice Mode**: Optimized for high-frequency audio telemetry, real-time transcription interception, and acoustic risk profiling.

## State Management

We use **Zustand** for lightweight, high-performance global state management.

### Store Definition
The [interactionMode.ts](file:///Users/macbookpro/Desktop/FactticAI/store/interactionMode.ts) store handles the mode state and its persistence.

```typescript
export const useInteractionMode = create<InteractionModeState>()(
  persist(
    (set) => ({
      mode: 'chat',
      setMode: (mode: InteractionMode) => set({ mode }),
    }),
    { name: 'facttic_interaction_mode' }
  )
);
```

### Persistence
The mode is persisted in `localStorage` under the key `facttic_interaction_mode`. This ensures that a user's operational context remains stable across page refreshes and browser sessions.

## UI Integration Pattern

Components and pages subscribe to the mode using the `useInteractionMode` hook.

### Example: Dynamic Content
```typescript
const { mode } = useInteractionMode();

return (
  <h1>{mode === 'voice' ? 'Voice Monitoring' : 'Live Observability'}</h1>
);
```

### Integration Points
1.  **Topbar**: The primary control center for switching between Global Chat and Global Voice contexts.
2.  **Connection Wizard**: Adjusts protocol instructions (e.g., SSE vs WebRTC).
3.  **Simulation & Observability**: Filters metrics and stress-test scenarios based on the channel characteristic.
4.  **Agent Marketplace**: Focuses on providers with modality-specific certifications.

## Governance Continuity
Crucially, switching the interaction mode **does not** alter the underlying governance engine, risk score normalization, or ledger persistence. It merely adjusts the lens through which governance data is viewed and configured.
