import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { EvidenceExportEngine } from '@/lib/compliance/evidenceExportEngine';
import { logger } from '@/lib/logger';

/**
 * Evidence Export API
 *
 * Generates and streams audit evidence bundles.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const options = await req.json();

    if (!options.types || !options.format) {
      return NextResponse.json({ error: 'Incomplete export configuration' }, { status: 400 });
    }

    const bundle = await EvidenceExportEngine.generateBundle({ ...options, org_id: orgId });

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
});
