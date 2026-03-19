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

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
