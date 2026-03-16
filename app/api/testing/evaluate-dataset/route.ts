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

    // Load dataset from /datasets
    const datasetPath = path.join(process.cwd(), 'datasets', `${dataset}.json`);
    if (!fs.existsSync(datasetPath)) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const datasetContent = fs.readFileSync(datasetPath, 'utf8');
    const records = JSON.parse(datasetContent);

    // Assume records are an array, or if it's a single object wrap it in an array
    const payload = Array.isArray(records) ? records : [records];

    const results = await evaluationRunner.executeRegressionSuite(dataset, model, payload);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
