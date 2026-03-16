import { bargeInAnalyzer } from "./bargeInAnalyzer"
import { overTalkAnalyzer } from "./overTalkAnalyzer"
import { voiceLatencyAnalyzer } from "./voiceLatencyAnalyzer"

export interface VoiceStreamEvent {
 speaker: string
 start_ms: number
 end_ms: number
 transcript_delta?: string
 latency_ms?: number
}

export async function voiceAnalyzerOrchestrator(
 events: VoiceStreamEvent[]
) {

 const barge = bargeInAnalyzer(events)

 const collision = overTalkAnalyzer(events)

 const latency = voiceLatencyAnalyzer(events)

 return {
  barge,
  collision,
  latency
 }

}

export default voiceAnalyzerOrchestrator
