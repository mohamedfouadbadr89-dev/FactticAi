import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Internal secured client bypassing RLS for fast telemetry writes
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type BehaviorSignalType = 'intent_drift' | 'context_overflow' | 'instruction_override' | 'prompt_violation';

export interface BehaviorSignal {
    signal_type: BehaviorSignalType;
    signal_score: number;
}

export interface ForensicsAnalysisResult {
    session_id: string;
    behavior_signals: BehaviorSignal[];
    risk_scores: {
        max_drift_alert: boolean;
        boundary_breach: boolean;
        overall_behavior_risk: number;
    }
}

export class BehaviorAnalyzer {

  /**
   * Evaluates deep behavioral signals across a single session.
   * Scans prompt inputs against outputs looking for explicit intent shifts
   * and context boundaries.
   */
  static async analyzeSession(org_id: string, session_id: string): Promise<ForensicsAnalysisResult> {
    
    // 1. Fetch Session Turns
    const { data: turns, error } = await supabase
      .from('turns')
      .select('user_message, ai_response')
      .eq('session_id', session_id)
      .limit(50); // Bounded for analysis window

    if (error || !turns || turns.length === 0) {
        throw new Error(`Failed to load session terms for forensics: ${error?.message || 'Empty Session'}`);
    }

    // 2. Compute Behavioral Signals (Normally hooks into local static ML layers)
    let intentDrift = 0;
    let contextOverflow = 0;
    let instructionOverride = 0;
    let promptViolation = 0;

    let totalLength = 0;

    turns.forEach((turn) => {
        const userMsg = (turn.user_message || '').toLowerCase();
        const aiMsg = (turn.ai_response || '').toLowerCase();
        
        totalLength += userMsg.length + aiMsg.length;

        // Context Saturation (Naive bounds checking)
        if (totalLength > 10000) contextOverflow += 0.4;
        else if (aiMsg.length > userMsg.length * 5) contextOverflow += 0.2;

        // Intent Drift (Agent changing the subject)
        if (aiMsg.includes('regardless') || aiMsg.includes('anyway') || aiMsg.includes('moving on')) {
            intentDrift += 0.35;
        }

        // Instruction Override (Agent refusing or apologizing repeatedly)
        if (aiMsg.includes('i cannot') || aiMsg.includes('im sorry but') || aiMsg.includes('i am unable')) {
            instructionOverride += 0.25;
        }

        // Prompt Violation (Agent exposing constraints or leaking logic)
        if (aiMsg.includes('system prompt') || aiMsg.includes('my instructions') || aiMsg.includes('ignore previous')) {
            promptViolation += 0.8;
        }
    });

    const behavior_signals: BehaviorSignal[] = [
        { signal_type: 'intent_drift', signal_score: Math.min(intentDrift, 1) },
        { signal_type: 'context_overflow', signal_score: Math.min(contextOverflow, 1) },
        { signal_type: 'instruction_override', signal_score: Math.min(instructionOverride, 1) },
        { signal_type: 'prompt_violation', signal_score: Math.min(promptViolation, 1) }
    ];

    // 3. Write Forensics Telemetry (Append-Only)
    const insertPayload = behavior_signals.map(sig => ({
        org_id,
        session_id,
        signal_type: sig.signal_type,
        signal_score: sig.signal_score
    }));

    const { error: insertError } = await supabase
        .from('behavior_forensics')
        .insert(insertPayload);

    if (insertError) {
        console.error('Failed to log behavior forensics telemetry', insertError);
    }

    // 4. Return Composite Status
    return {
        session_id,
        behavior_signals,
        risk_scores: {
            max_drift_alert: intentDrift > 0.7,
            boundary_breach: promptViolation > 0.5,
            overall_behavior_risk: Math.min((intentDrift + contextOverflow + instructionOverride + promptViolation) / 4, 1)
        }
    };
  }
}
