import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { ReportGenerator, ReportConfig } from '@/lib/reports/reportGenerator';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  // Use org_id from session auth (withAuth already verified the user)
  // verifyApiKey is only needed for external API access without session
  const verifiedOrgId = orgId;

  try {
    const config: ReportConfig = await req.json();

    if (!config.startDate || !config.endDate || !config.metrics) {
      return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
    }

    const requestedFormat = (config as any).format || 'csv';

    let content: string;
    let contentType: string;
    let filename: string;

    if (requestedFormat === 'html') {
      content = await ReportGenerator.generateHTML(orgId, config);
      contentType = 'text/html';
      filename = `governance_report_${Date.now()}.html`;
    } else {
      content = await ReportGenerator.generateCSV(orgId, config);
      contentType = 'text/csv';
      filename = `governance_report_${Date.now()}.csv`;
    }

    // Log the report definition in the database
    const { data: reportDef, error: dbError } = await supabaseServer
      .from('report_definitions')
      .insert({
        org_id: orgId,
        name: `Manual Report - ${new Date().toLocaleDateString()}`,
        config,
        format: requestedFormat
      })
      .select()
      .single();

    if (dbError) {
      logger.error('REPORT_DEFINITION_LOGGING_FAILED', { orgId, error: dbError.message });
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    logger.error('REPORT_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
