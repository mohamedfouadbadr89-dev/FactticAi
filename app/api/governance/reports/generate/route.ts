import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { ReportGenerator, ReportConfig } from '@/lib/reports/reportGenerator';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
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
    const config: ReportConfig = await req.json();
    const { format } = (await req.json() as any); // Re-parsing for format if not in config, but let's assume it's there

    if (!config.startDate || !config.endDate || !config.metrics) {
      return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
    }

    // Determine format from request or default to csv
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
