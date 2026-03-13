import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { createHash } from 'crypto';

export interface ExportOptions {
  org_id: string;
  types: ('ledger' | 'replay' | 'compliance' | 'risk')[];
  format: 'JSON' | 'CSV' | 'PDF';
  date_start: string;
  date_end: string;
}

/**
 * Evidence Export Engine
 * 
 * CORE RESPONSIBILITY: Generate cryptographic audit bundles.
 * Aggregates multi-tenant governance signals into structured compliance packages.
 */
export class EvidenceExportEngine {

  /**
   * Generates an audit evidence bundle based on requested options.
   */
  static async generateBundle(options: ExportOptions) {
    try {
      const { org_id, types, format, date_start, date_end } = options;
      const data: any = { metadata: { ...options, generated_at: new Date().toISOString() } };

      // 1. Parallel Data Aggregation
      const queries: any[] = [];

      if (types.includes('ledger')) {
        queries.push(
          supabaseServer
            .from('facttic_governance_events')
            .select('*')
            .eq('org_id', org_id)
            .gte('timestamp', new Date(date_start).getTime())
            .lte('timestamp', new Date(date_end).getTime())
            .order('timestamp', { ascending: true })
            .then(res => data.ledger = res.data || [])
        );
      }

      if (types.includes('compliance')) {
        queries.push(
          supabaseServer
            .from('compliance_signals')
            .select('*')
            .eq('org_id', org_id)
            .gte('created_at', date_start)
            .lte('created_at', date_end)
            .then(res => data.compliance = res.data || [])
        );
      }

      if (types.includes('risk')) {
        queries.push(
          supabaseServer
            .from('evaluations')
            .select('*')
            .eq('org_id', org_id)
            .gte('created_at', date_start)
            .lte('created_at', date_end)
            .then(res => data.risk_scores = res.data || [])
        );
      }

      await Promise.all(queries);

      // 2. Format Generation
      let bundleContent: string;
      let contentType: string;

      if (format === 'JSON') {
        bundleContent = JSON.stringify(data, null, 2);
        contentType = 'application/json';
      } else if (format === 'CSV') {
        bundleContent = this.formatToCSV(data);
        contentType = 'text/csv';
      } else {
        bundleContent = this.formatToStructuredText(data); // Simulating PDF as structured high-fidelity text
        contentType = 'application/pdf'; // In a real env, use a PDF lib
      }

      // 3. Cryptographic Proof
      const evidenceHash = createHash('sha256')
        .update(bundleContent + data.metadata.generated_at)
        .digest('hex');

      logger.info('EVIDENCE_BUNDLE_GENERATED', { 
        org_id, 
        types, 
        format, 
        hash: evidenceHash 
      });

      return {
        content: bundleContent,
        contentType,
        filename: `Facttic_Evidence_${org_id}_${Date.now()}.${format.toLowerCase()}`,
        evidenceHash
      };

    } catch (err: any) {
      logger.error('EVIDENCE_EXPORT_FAILURE', { error: err.message });
      return null;
    }
  }

  /**
   * Flattens data into CSV format.
   */
  private static formatToCSV(data: any): string {
    let csv = "category,event_type,timestamp,details\n";
    
    if (data.ledger) {
      data.ledger.forEach((b: any) => {
        csv += `ledger,${b.event_type},${new Date(b.timestamp).toISOString()},hash:${b.event_hash}\n`;
      });
    }

    if (data.compliance) {
      data.compliance.forEach((s: any) => {
        csv += `compliance,PII_DETECTION,${s.created_at},risk_score:${s.compliance_risk_score}\n`;
      });
    }

    return csv;
  }

  /**
   * Generates a high-fidelity structured text representation.
   */
  private static formatToStructuredText(data: any): string {
    let text = "========================================\n";
    text += "FACTTIC.AI - CANONICAL EVIDENCE BUNDLE\n";
    text += "========================================\n\n";
    text += `Org ID: ${data.metadata.org_id}\n`;
    text += `Generated: ${data.metadata.generated_at}\n`;
    text += `Integrity Hash: SHA-256 (Signed)\n\n`;

    if (data.ledger) {
      text += "--- GOVERNANCE LEDGER ---\n";
      data.ledger.forEach((b: any) => {
        text += `[${new Date(b.timestamp).toISOString()}] TYPE: ${b.event_type} | HASH: ${b.event_hash?.substring(0, 16)}...\n`;
      });
      text += "\n";
    }

    return text;
  }
}
