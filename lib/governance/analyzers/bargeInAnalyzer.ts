import { VoiceStreamEvent } from "./voiceAnalyzerOrchestrator"

export function bargeInAnalyzer(events: VoiceStreamEvent[]) {
    // Detect when user interrupts agent: user.start_ms < agent.end_ms
    const users = events.filter(e => e.speaker === 'user');
    const agents = events.filter(e => e.speaker === 'agent');
    
    if (users.length === 0 || agents.length === 0) return false;
    
    // Check simplest collision in history
    for (const u of users) {
        for (const a of agents) {
            if (u.start_ms < a.end_ms && u.end_ms > a.start_ms) {
                return true;
            }
        }
    }
    return false;
}
