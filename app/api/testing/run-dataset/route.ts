import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { evaluationRunner } from '@/lib/evaluation/evaluationRunner';
import fs from 'fs';
import path from 'path';

export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const body = await req.json();
    const { dataset, model } = body;

    if (!dataset || !model) {
      return NextResponse.json({ error: 'Missing dataset or model parameter' }, { status: 400 });
    }

    const datasetPath = path.join(process.cwd(), 'datasets', `${dataset}.json`);
    if (!fs.existsSync(datasetPath)) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const records = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const payload = Array.isArray(records) ? records : [records];

    const results = await evaluationRunner.executeRegressionSuite({
      datasetName: dataset,
      model,
      records: payload,
      org_id: orgId,
      user_id: userId,
    });

    const total = results.length;
    let hallucinationCount = 0;
    let policyViolationCount = 0;
    let totalRiskScore = 0;

    results.forEach(r => {
      if (r.hallucination_flag) hallucinationCount++;
      if (r.policy_violation) policyViolationCount++;
      totalRiskScore += r.risk_score;
    });

    const metrics = {
      accuracy: total > 0 ? ((total - (hallucinationCount + policyViolationCount)) / total) * 100 : 0,
      hallucination_rate: total > 0 ? (hallucinationCount / total) * 100 : 0,
      policy_violation_rate: total > 0 ? (policyViolationCount / total) * 100 : 0,
      risk_score_average: total > 0 ? totalRiskScore / total : 0,
    };

    return NextResponse.json({ success: true, metrics, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
