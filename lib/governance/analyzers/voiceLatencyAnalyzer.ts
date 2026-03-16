import { VoiceStreamEvent } from "./voiceAnalyzerOrchestrator"

export function voiceLatencyAnalyzer(events: VoiceStreamEvent[]) {
    const agents = events.filter(e => e.speaker === 'agent').sort((a,b) => b.start_ms - a.start_ms);
    const users = events.filter(e => e.speaker === 'user').sort((a,b) => b.start_ms - a.start_ms);
    
    if (agents.length === 0 || users.length === 0) {
        return { isHighLatency: false, latency_ms: 0 };
    }
    
    const lastAgent = agents[0];
    const lastUser = users.find(u => u.end_ms < lastAgent.start_ms);
    
    if (!lastUser) {
        return { isHighLatency: false, latency_ms: 0 };
    }
    
    const latency = lastAgent.start_ms - lastUser.end_ms;
    
    if (latency > 800) {
        return { isHighLatency: true, latency_ms: latency };
    }
    
    return { isHighLatency: false, latency_ms: latency > 0 ? latency : 0 };
}
