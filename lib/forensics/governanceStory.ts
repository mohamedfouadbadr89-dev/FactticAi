import type { LedgerEvent } from './incidentService';

/**
 * Governance Story Generator (v1.0)
 * 
 * CORE PRINCIPLE: Telemetry Humanization.
 * Converts raw signal patterns into a readable narrative describing governance outcomes.
 */

export function generateGovernanceStory(events: LedgerEvent[]): string {
  if (events.length === 0) return "No telemetry events were recorded for this session.";

  const peakRisk = Math.max(...events.map(e => e.risk_score));
  const totalEvents = events.length;
  const blocked = events.some(e => e.decision === 'BLOCK');
  const warned = events.some(e => e.decision === 'WARN');
  const highRiskDetected = events.some(e => e.risk_score > 50);

  // Parse signal types from events
  const allSignalTypes: string[] = [];
  events.forEach(e => {
    if (e.signals) {
      try {
        const parsed = JSON.parse(e.signals);
        if (Array.isArray(parsed)) parsed.forEach((s: any) => allSignalTypes.push(s.type || s.signal_type || String(s)));
        else if (typeof parsed === 'object') Object.keys(parsed).forEach(k => allSignalTypes.push(k));
      } catch {}
    }
  });
  const uniqueSignals = [...new Set(allSignalTypes)];

  let story = "";

  // 1. Initial Assessment
  if (peakRisk > 75) {
    story += "This interaction was flagged as a critical governance violation. ";
  } else if (peakRisk > 50) {
    story += "This interaction exhibited suspicious behavior that reached moderate risk thresholds. ";
  } else {
    story += "This was a standard AI interaction that remained within normal operating parameters. ";
  }

  // 2. Technical Trigger Analysis
  if (highRiskDetected) {
    story += "The Guardrail Kernel detected suspicious activity or pattern mismatches in the real-time telemetry stream. ";
  }

  if (uniqueSignals.length > 0) {
    story += `Detection signals were triggered, including: ${uniqueSignals.join(', ')}. `;
  }

  // 3. Outcome Description
  if (blocked) {
    story += "As a result of these triggers, the Governance Pipeline issued a deterministic block, preventing the response from reaching the client. ";
  } else {
    story += "The interaction was allowed to proceed, though its signals have been persisted for audit. ";
  }

  // 4. Persistence & Escalation
  if (warned || peakRisk > 30) {
    story += "This session has been marked for forensic follow-up.";
  }

  return story;
}
