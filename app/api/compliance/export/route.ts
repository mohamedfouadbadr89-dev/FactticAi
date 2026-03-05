import { NextRequest, NextResponse } from 'next/server';
import { EvidenceExportEngine } from '@/lib/compliance/evidenceExportEngine';
import { logger } from '@/lib/logger';

/**
 * Evidence Export API
 * 
 * Generates and streams audit evidence bundles.
 */
export async function POST(req: NextRequest) {
  try {
    const options = await req.json();

    if (!options.org_id || !options.types || !options.format) {
      return NextResponse.json({ error: 'Incomplete export configuration' }, { status: 400 });
    }

    const bundle = await EvidenceExportEngine.generateBundle(options);

    if (!bundle) {
      return NextResponse.json({ error: 'Failed to generate evidence bundle' }, { status: 500 });
    }

    return new NextResponse(bundle.content, {
      status: 200,
      headers: {
        'Content-Type': bundle.contentType,
        'Content-Disposition': `attachment; filename="${bundle.filename}"`,
        'X-Evidence-Hash': bundle.evidenceHash
      }
    });

  } catch (err: any) {
    logger.error('EXPORT_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
