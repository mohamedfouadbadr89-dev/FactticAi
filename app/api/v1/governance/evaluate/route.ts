import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/governance/evaluate
 * Atomic evaluation of AI interactions via the Facttic Governance Engine.
 * Replaces simulated Math.random() with production pipeline.
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
    try {
        const body = await req.json();
        const { prompt, model, session_id } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Execute strict governance pipeline v5.0 (Fail-Closed default)
        const result = await GovernancePipeline.execute({
            org_id: orgId,
            user_id: userId,
            prompt,
            model: model || 'facttic-v5-evaluate',
            session_id: session_id || undefined,
            playground_mode: false,
            client_sent_at: Date.now(),
            timeout_ms: 2000
        });

        // Map behavior to drift indicators for v1 compatibility
        const drift_indicators = [];
        if (result.behavior?.intent_drift > 50) drift_indicators.push("HIGH_INTENT_DRIFT");
        if (result.behavior?.toxicity > 50) drift_indicators.push("HIGH_TOXICITY");

        const feedback = {
            risk_score: result.risk_score / 100, // Scale to 0-1 for compatibility
            decision: result.decision,
            policy_flags: (result.violations || []).map((v: any) => v.policy_name || v.rule),
            drift_indicators,
            session_id: result.session_id,
            metadata: {
                latency_ms: result.latency || 0,
                engine: 'v5.0-production'
            }
        };

        return NextResponse.json(feedback, { status: 200 });
    } catch (err: any) {
        logger.error('V1_GOVERNANCE_EVALUATE_CRITICAL_FAILURE', { error: err.message, orgId });
        return NextResponse.json({ 
            error: 'Internal Governance Engine Error',
            decision: 'BLOCK', // Fail-Closed
            risk_score: 1.0
        }, { status: 500 });
    }
});
