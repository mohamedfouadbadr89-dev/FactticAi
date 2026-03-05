import { NextRequest, NextResponse } from 'next/server';
import { ModelConsistencyEngine } from '@/lib/intelligence/modelConsistencyEngine';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelA, modelB } = await req.json();

    if (!prompt || !modelA || !modelB) {
      return NextResponse.json({ error: 'Missing required parameters: prompt, modelA, modelB' }, { status: 400 });
    }

    const result = await ModelConsistencyEngine.compareModels(prompt, modelA, modelB);

    return NextResponse.json(result);
  } catch (err: any) {
    logger.error('API_MODEL_CONSISTENCY_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'Failed to execute consistency test' }, { status: 500 });
  }
}
