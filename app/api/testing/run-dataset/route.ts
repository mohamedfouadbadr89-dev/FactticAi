import { NextResponse } from 'next/server';
import { evaluationRunner } from '@/lib/evaluation/evaluationRunner';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dataset, model } = body;

    if (!dataset || !model) {
      return NextResponse.json({ error: 'Missing dataset or model parameter' }, { status: 400 });
    }

    // Load dataset
    const datasetPath = path.join(process.cwd(), 'datasets', `${dataset}.json`);
    if (!fs.existsSync(datasetPath)) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const datasetContent = fs.readFileSync(datasetPath, 'utf8');
    const records = JSON.parse(datasetContent);
    const payload = Array.isArray(records) ? records : [records];

    const results = await evaluationRunner.executeRegressionSuite(dataset, model, payload);

    // Calculate metrics
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
        accuracy: total - (hallucinationCount + policyViolationCount) > 0 ? ((total - (hallucinationCount + policyViolationCount)) / total) * 100 : 0,
        hallucination_rate: (hallucinationCount / total) * 100,
        policy_violation_rate: (policyViolationCount / total) * 100,
        risk_score_average: totalRiskScore / total
    };

    return NextResponse.json({ success: true, metrics, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
