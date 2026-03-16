import { VoiceStreamEvent } from "./voiceAnalyzerOrchestrator"

export function overTalkAnalyzer(events: VoiceStreamEvent[]) {
    let overlap_ms = 0;
    
    const users = events.filter(e => e.speaker === 'user');
    const agents = events.filter(e => e.speaker === 'agent');
    
    for (const u of users) {
        for (const a of agents) {
            const startOverlap = Math.max(u.start_ms, a.start_ms);
            const endOverlap = Math.min(u.end_ms, a.end_ms);
            if (endOverlap > startOverlap) {
                overlap_ms += (endOverlap - startOverlap);
            }
        }
    }

    let min_start = Number.MAX_SAFE_INTEGER;
    let max_end = 0;
    for (const e of events) {
        if (e.start_ms < min_start) min_start = e.start_ms;
        if (e.end_ms > max_end) max_end = e.end_ms;
    }

    const total_speech_time = max_end > min_start ? max_end - min_start : 0;
    const collision_index = total_speech_time > 0 ? overlap_ms / total_speech_time : 0;

    return {
        hasCollision: overlap_ms > 0,
        overlap_ms,
        collision_index
    };
}
