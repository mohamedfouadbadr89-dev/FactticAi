import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';

export const POST = withAuth(async (req: Request, { userId, orgId }: AuthContext) => {
    try {
        // Re-verifying org context explicitly as per Phase 1 security requirement
        const orgCtx = await resolveOrgContext(userId);
        if (orgCtx.org_id !== orgId) {
            throw new Error('Organization context mismatch');
        }

        const body = await req.json().catch(() => ({}));
        const { prompt, model, session_id } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Execution via real GovernancePipeline v5.0
        const result = await GovernancePipeline.execute({
            org_id: orgId,
            user_id: userId,
            prompt,
            model: model || 'v1-default',
            session_id: session_id || null,
            playground_mode: false, // Production evaluation
            client_sent_at: Date.now()
        });

        const feedback = {
            risk_score: result.risk_score,
            policy_flags: result.violations?.map((v: any) => v.policy_name) || [],
            decision: result.decision,
            session_id: result.session_id,
            audit_hash: result.hash,
            drift_indicators: [] // Reserved for future drift signals
        };

        return NextResponse.json(feedback, { status: 200 });
    } catch (err: any) {
        logger.error('GOVERNANCE_EVALUATE_V1_FAILURE', { 
            error: err.message, 
            userId, 
            orgId 
        });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
});

