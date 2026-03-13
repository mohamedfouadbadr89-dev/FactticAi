import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { ReportGenerator, ReportConfig } from '@/lib/reports/reportGenerator';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Specialized endpoint for high-fidelity PDF report generation.
 * This route leverages Puppeteer to convert enriched HTML templates into
 * board-ready executive PDFs.
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const config: ReportConfig = await req.json();
    
    logger.info('PDF_GENERATION_INITIATED', { orgId, userId, metrics: config.metrics });

    // 1. Generate the PDF buffer
    const pdfBuffer = await ReportGenerator.generatePDF(orgId, config);

    // 2. Log the export event for governance audit
    const { error: dbError } = await supabaseServer
      .from('report_definitions')
      .insert({
        org_id: orgId,
        name: `Executive Export - ${new Date().toISOString()}`,
        config: config,
        format: 'pdf',
      });

    if (dbError) {
      logger.error('REPORT_AUDIT_LOGGING_FAILED', { orgId, error: dbError.message });
    }

    // 3. Stream binary response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facttic_governance_report_${Date.now()}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    logger.error('PDF_ENDPOINT_FAILURE', { error: error.message });
    return NextResponse.json(
      { error: 'High-fidelity PDF generation failed. Please check the engine logs.' },
      { status: 500 }
    );
  }
});
