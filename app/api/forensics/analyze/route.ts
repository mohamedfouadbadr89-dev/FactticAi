import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { BehaviorAnalyzer } from '@/lib/forensics/behaviorAnalyzer';
import { z } from 'zod';

const ForensicsAnalysisSchema = z.object({
  session_id: z.string().uuid()
});

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const json = await req.json();
    const result = ForensicsAnalysisSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { session_id } = result.data;

    const forensicsResult = await BehaviorAnalyzer.analyzeSession(orgId, session_id);

    return NextResponse.json({
      behavior_signals: forensicsResult.behavior_signals,
      risk_scores: forensicsResult.risk_scores
    });

  } catch (error: any) {
    console.error('Forensics execution failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
