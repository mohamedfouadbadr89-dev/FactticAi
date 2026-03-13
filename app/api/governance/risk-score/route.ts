import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { RiskMetricsEngine } from '@/lib/intelligence/riskMetricsEngine';

export async function GET(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Attempt to get the latest score, or calculate a fresh one
    let score = await RiskMetricsEngine.getLatestScore(org_id);
    
    if (!score) {
      score = await RiskMetricsEngine.calculateRiskScore(org_id);
    }

    return NextResponse.json(score);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
